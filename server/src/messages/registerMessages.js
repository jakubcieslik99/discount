import { config } from '../config/utilities'

const registerUserMessage = (to, nick, token) => {
  return {
    from: `Discount <${config.NOREPLY_ADDRESS}>`,
    to,
    subject: `Potwierdź rejestrację w serwisie Discount`,
    text: `
      Witaj ${nick}! 
      Dziękujemy za rejestrację w Discount. 
      Proszę skopiuj i wklej w przeglądarce poniższy link w celu potwierdzenia swojego konta w serwisie.
      ${config.WEBAPP_URL}/confirm?token=${token}
    `,
    html: `
      <h1>Witaj ${nick}!</h1>
      <h4>Dziękujemy za rejestrację w Discount.</h4>
      <p>Proszę kliknij poniższy link w celu potwierdzenia swojego konta w serwisie.</p>
      <a href="${config.WEBAPP_URL}/signin?token=${token}">Potwierdź</a>
    `,
  }
}

const resendUserAccountConfirmationMessage = (to, nick, token) => {
  return {
    from: `Discount <${config.NOREPLY_ADDRESS}>`,
    to,
    subject: `Potwierdź adres email w serwisie Discount`,
    text: `
      Witaj ${nick}! 
      Dziękujemy za rejestrację w Discount. 
      Proszę skopiuj i wklej w przeglądarce poniższy link w celu potwierdzenia swojego konta w serwisie.
      ${config.WEBAPP_URL}/confirm?token=${token}
    `,
    html: `
      <h1>Witaj ${nick}!</h1>
      <h4>Dziękujemy za rejestrację w Discount.</h4>
      <p>Proszę kliknij poniższy link w celu potwierdzenia swojego konta w serwisie.</p>
      <a href="${config.WEBAPP_URL}/signin?token=${token}">Potwierdź</a>
    `,
  }
}

export { registerUserMessage, resendUserAccountConfirmationMessage }
