import Joi from "joi";

export const validatePost = (data) => {
  const schema = Joi.object({
    content: Joi.string().max(5000).required(),
    mediaIds: Joi.array(),
  });
  return schema.validate(data);
};
