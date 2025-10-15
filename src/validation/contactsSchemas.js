import Joi from 'joi';

const stringField = Joi.string().min(3).max(20);

export const createContactSchema = Joi.object({
  name: stringField.required(),
  phoneNumber: stringField.required(),
  email: Joi.string().email(),
  isFavourite: Joi.boolean(),
  contactType: Joi.string()
    .valid('work', 'home', 'personal')
    .default('personal'),
});

export const updateContactSchema = Joi.object({
  name: stringField.optional(),
  phoneNumber: stringField.optional(),
  email: Joi.string().email().optional(),
  isFavourite: Joi.boolean().optional(),
  contactType: Joi.string().valid('work', 'home', 'personal').optional(),
}).min(1);
