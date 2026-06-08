import mongoose from "mongoose";

const searchSchema = new mongoose.Schema(
  {
    postId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

searchSchema.index({ content: "text" });
searchSchema.index({ createdAt: -1 });

const Search = mongoose.model("Search", searchSchema);

export default Search;
