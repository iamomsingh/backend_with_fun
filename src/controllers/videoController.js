import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/videoModel.js";
import { User } from "../models/userModel.js";
import { Like } from "../models/likeModel.js";
import { Comment } from "../models/commentModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos based on query, sort, pagination

  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pipeline = [];

  // for using Full Text based search u need to create a search index in mongoDB atlas
  // you can include field mapppings in search index eg.title, description, as well
  // Field mappings specify which fields within your documents should be indexed for text search.
  // this helps in seraching only in title, desc providing faster search results
  // here the name of search index is 'search-videos'

  if (query) {
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          query: query,
          path: ["title", "description"], //search only on title, desc
        },
      },
    });
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid UserID");
    }

    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  //fetch videos in which isPublished is true
  pipeline.push({
    $match: {
      isPublished: true,
    },
  });

  //sort by views, createdAt, duration in ascending(-1) or descending(1)
  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              userName: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetails",
    }
  );

  const options = {
    page: parseInt(page, 1),
    limit: parseInt(limit, 10),
  };

  const video = await Video.aggregatePaginate(
    Video.aggregate(pipeline),
    options
  );

  return res
    .status(200)
    .json(new ApiResponse(200, video, "videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required...");
  }

  // checking for files
  console.log(req.files);
  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "video is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!(videoFile || thumbnail)) {
    throw new ApiError(500, "Error while uploading on cloudinary");
  }

  const duration =
    typeof videoFile.duration === "string"
      ? parseFloat(videoFile.duration)
      : videoFile.duration;

  const createdVideo = await Video.create({
    videoFile: {
      url: videoFile?.url,
      public_id: videoFile.public_id,
    },
    thumbnail: {
      url: thumbnail?.url,
      public_id: thumbnail.public_id,
    },
    title,
    description,
    duration,
    owner: req.user._id,
    isPublished: false,
  });

  if (!createdVideo) {
    throw new ApiError(500, "Error while creating video.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdVideo, "Video uploaded Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  // there is no need to do seperate search of video by findById
  //   const video = await Video.findById(videoId);
  //
  //   if (!video) {
  //     throw new ApiError(400, "No video with this videoId is available");
  //   }
  //
  //   if (video.views === undefined) {
  //     video.views = 1;
  //   } else {
  //     video.views += 1;
  //   }
  //
  //   await video.save();

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              userName: 1,
              "avatar.url": 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        likesCount: {
          $size: "$likes",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        "videoFile.url": 1,
        "thumbnail.url": 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        commentsCount: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video) {
    throw new ApiError(500, "failed to fetched video");
  }

  //increment view if fetched successfully
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });

  const userId = req.user?._id;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  // add this video to user watch History

  // $push: {
  //   watchHistory: videoId,
  // },

  //or
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $addToSet: {
        watchHistory: videoId,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "video details fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  //TODO: update video details like title, description, thumbnail
  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  if (!(title || description)) {
    throw new ApiError(400, "fields are required to update");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video Found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "You are not authorized to edit this video");
  }

  //deleting old thumbnail & updating with new thumbnail
  const oldThumbnail = video.thumbnail.public_id;

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail.url) {
    throw new ApiError(500, "thumbnail not found");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    video?._id,
    {
      $set: {
        title,
        description,
        thumbnail: {
          public_id: thumbnail.public_id,
          url: thumbnail.url,
        },
      },
    },
    {
      new: true,
    }
  );

  if (!updatedVideo) {
    throw new ApiError(500, "Error while updating the video.");
  }

  if (oldThumbnail && updatedVideo) {
    await deleteFromCloudinary(oldThumbnail);
  }

  return res
    .status(201)
    .json(new ApiResponse(200, updatedVideo, "Video Updated Successfully..."));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const chooseVideoToDelete = await Video.findById(videoId);

  if (!chooseVideoToDelete) {
    throw new ApiError(404, "No video found");
  }

  if (chooseVideoToDelete?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't delete this video as you are not the owner"
    );
  }

  //get publicid from videodmodel when save  at a "publishAVideo" time.
  const deleteVideoFromCloudinary = await deleteFromCloudinary(
    chooseVideoToDelete?.videoFile?.public_id
  );

  const deleteThumbnailFromCloudinary = await deleteFromCloudinary(
    chooseVideoToDelete?.thumbnail?.public_id
  );

  if (!(deleteVideoFromCloudinary || deleteThumbnailFromCloudinary)) {
    throw new ApiError(400, "Error occur while deleting files from cloudinary");
  }

  // delete video likes
  await Like.deleteMany({
    video: videoId,
  });

  // delete video comments
  await Comment.deleteMany({
    video: videoId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully..."));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video Not Found");
  }

  if (req.user?._id.toString() !== video.owner.toString()) {
    throw new ApiError(401, "You are not authorized to modify this video.");
  }

  const toggleVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    {
      new: true,
    }
  );

  if (!toggleVideo) {
    throw new ApiError(500, "Error While updating the video");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        "Video published status is updated successfully "
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
