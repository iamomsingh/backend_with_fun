import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/likeModel.js";
import { Video } from "../models/videoModel.js";
import { Comment } from "../models/commentModel.js";
import { Tweet } from "../models/tweetModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//TODO: toggle like on video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "videoId is not valid");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video Not Found");
  }

  const likedAlready = await Like.findOne({
    video: video,
    likedBy: req?.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    video: video,
    likedBy: req?.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

//TODO: toggle like on comment
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment Not Found");
  }

  const likedAlready = await Like.findOne({
    comment: commentId,
    likedBy: req?.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    comment: commentId,
    likedAlready: req.user._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

//TODO: toggle like on tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet Not Found");
  }

  const likedAlready = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);

    return res
      .status(200)
      .json(new ApiResponse(200, { tweetId, isLiked: false }));
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

//TODO: get all liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideosAggregate = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },
          {
            $unwind: "$ownerDetails",
          },
        ],
      },
    },
    {
      $unwind: "$likedVideo",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        likedVideo: {
          _id: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          owner: 1,
          title: 1,
          description: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          isPublished: 1,
          ownerDetails: {
            userName: 1,
            fullName: 1,
            "avatar.url": 1,
          },
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedVideosAggregate,
        "liked Videos fetched successfully"
      )
    );
});

// const getLikedVideos = asyncHandler(async (req, res) => {
//   const { userId } = req.params;
//   if (!isValidObjectId(userId)) {
//     throw new ApiError(400, "Invalid user id");
//   }
//   const { page = 1, limit = 10 } = req.query;
//   const parsedLimit = parseInt(limit);
//   const pageSkip = (page - 1) * parsedLimit;
//
//   const allLikedVideos = await Like.find({ likedBy: userId })
//     .skip(pageSkip)
//     .limit(parsedLimit)
//     .populate({
//       path: "video",
//       select: "title description thumbnail",
//       populate: {
//         path: "owner",
//         select: "username avatar",
//       },
//     });
//
//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, allLikedVideos, "Liked videos fetched successfully")
//     );
// });

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
