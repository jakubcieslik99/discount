import Joi from 'joi'

const createDiscountValidation = Joi.object({
  title: Joi.string().required().max(60),
  price: Joi.number().required().integer().min(0).max(999999999),
  prevprice: Joi.number().integer().min(0).max(999999999),
  store: Joi.string().allow('').max(25),
  freeShipping: Joi.bool(),
  description: Joi.string().allow('').max(1000),
  discountCode: Joi.string().allow('').max(25),
  link: Joi.string()
    .required()
    .max(300)
    .pattern(
      new RegExp(/^((https?:\/\/)?)[a-zA-Z0-9]{1}[a-zA-Z0-9-.]{0,}\.[a-z]{2,13}[a-zA-Z0-9:/?#[\]@!$%&'()*+,;=\-.]{0,}$/)
    ),
  category: Joi.string().valid(
    'artykuly_spozywcze',
    'dom_i_ogrod',
    'elektronika',
    'moda',
    'podroze',
    'rozrywka',
    'sport',
    'subskrypcje_i_uslugi',
    'zdrowie_i_uroda',
    'inne'
  ),
})

const updateDiscountValidation = Joi.object({
  title: Joi.string().required().max(60),
  price: Joi.number().required().integer().min(0).max(999999999),
  prevprice: Joi.number().integer().min(0).max(999999999),
  store: Joi.string().allow('').max(25),
  freeShipping: Joi.bool(),
  description: Joi.string().allow('').max(1000),
  discountCode: Joi.string().allow('').max(25),
  link: Joi.string()
    .required()
    .max(300)
    .pattern(
      new RegExp(/^((https?:\/\/)?)[a-zA-Z0-9]{1}[a-zA-Z0-9-.]{0,}\.[a-z]{2,13}[a-zA-Z0-9:/?#[\]@!$%&'()*+,;=\-.]{0,}$/)
    ),
  category: Joi.string().valid(
    'artykuly_spozywcze',
    'dom_i_ogrod',
    'elektronika',
    'moda',
    'podroze',
    'rozrywka',
    'sport',
    'subskrypcje_i_uslugi',
    'zdrowie_i_uroda',
    'inne'
  ),
})

const commentDiscountValidation = Joi.object({
  message: Joi.string().required().max(300),
})

const categoriesValidation = Joi.object({
  category: Joi.string().valid(
    'artykuly_spozywcze',
    'dom_i_ogrod',
    'elektronika',
    'moda',
    'podroze',
    'rozrywka',
    'sport',
    'subskrypcje_i_uslugi',
    'zdrowie_i_uroda',
    'inne'
  ),
})

export { createDiscountValidation, updateDiscountValidation, commentDiscountValidation, categoriesValidation }
