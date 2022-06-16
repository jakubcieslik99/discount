import { config } from '../config/utilities'

const sendUserPasswordResetMessage = (to, nick, token) => {
  return {
    from: `Discount 🎟️ <${config.NOREPLY_ADDRESS}>`,
    to,
    subject: `🛡️ Zresetuj hasło w serwisie Discount 🎟️`,
    text: `
      Witaj ${nick}!
      Na Twoim koncie została wygenerowana prośba o zresetowanie hasła. Jeśli to nie Ty ją wygenerowałeś, zignoruj tą wiadomość.
      Proszę skopiuj i wklej w przeglądarce poniższy link w celu zresetowania swojego hasła w serwisie.
      ${config.WEBAPP_URL}/reset?token=${token}
    `,
    html: `
      <h1>Witaj ${nick}!</h1>
      <h4>Na Twoim koncie została wygenerowana prośba o zresetowanie hasła. Jeśli to nie Ty ją wygenerowałeś, zignoruj tą wiadomość. </h4>
      <p>Proszę kliknij poniższy link w celu zresetowania swojego hasła w serwisie.</p>
      <a href="${config.WEBAPP_URL}/reset?token=${token}">Ustaw nowe hasło</a>
    `,
  }
}

export { sendUserPasswordResetMessage }
