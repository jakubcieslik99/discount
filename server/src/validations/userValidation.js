import Joi from 'joi'

const registerUserValidation = Joi.object({
  email: Joi.string()
    .required()
    .max(60)
    .pattern(
      new RegExp(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )
    ),
  nick: Joi.string()
    .required()
    .max(30)
    .pattern(
      new RegExp(
        /^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšśžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð_-]+$/
      )
    ),
  password: Joi.string().required().min(8).max(60),
  repassword: Joi.ref('password'),
  rules: Joi.boolean().required().invalid(false),
})

const loginUserValidation = Joi.object({
  email: Joi.string()
    .required()
    .max(60)
    .pattern(
      new RegExp(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )
    ),
  password: Joi.string().required().min(8).max(60),
})

const updateUserValidation = Joi.object({
  email: Joi.string()
    .required()
    .max(60)
    .pattern(
      new RegExp(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )
    ),
  nick: Joi.string()
    .required()
    .max(30)
    .pattern(
      new RegExp(
        /^[0-9a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšśžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð_-]+$/
      )
    ),
  password: Joi.string().required().min(8).max(60),
  newpassword: Joi.string().allow('').min(8).max(60),
})

const resendUserAccountConfirmationValidation = Joi.object({
  email: Joi.string()
    .required()
    .max(60)
    .pattern(
      new RegExp(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )
    ),
  password: Joi.string().required().min(8).max(60),
})

const confirmUserAccountValidation = Joi.object({
  token: Joi.string().required(),
})

const sendUserPasswordResetValidation = Joi.object({
  email: Joi.string()
    .required()
    .max(60)
    .pattern(
      new RegExp(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )
    ),
})

const resetUserPasswordValidation = Joi.object({
  password: Joi.string().required().min(8).max(60),
  repassword: Joi.ref('password'),
  token: Joi.string().required(),
})

export {
  registerUserValidation,
  loginUserValidation,
  updateUserValidation,
  resendUserAccountConfirmationValidation,
  confirmUserAccountValidation,
  sendUserPasswordResetValidation,
  resetUserPasswordValidation,
}
