import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { to, candidate_name, form_url } = body;

    if (!to || !form_url) {
      return Response.json({ error: 'Missing to or form_url' }, { status: 400 });
    }

    const subject = 'Заполнение анкеты кандидата — Bratouveriye SNB';
    const htmlBody = `
<!DOCTYPE html>
<html lang=\"ru\">
<head>
<meta charset=\"UTF-8\">
<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
<title>${subject}</title>
</head>
<body style=\"margin:0;padding:0;background-color:#05070A;font-family:'Arial',sans-serif;\">
  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#05070A;padding:40px 20px;\">
    <tr>
      <td align=\"center\">
        <table width=\"580\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:linear-gradient(135deg,#0D1B3E 0%,#05070A 100%);border:1px solid rgba(123,63,191,0.25);border-radius:16px;overflow:hidden;max-width:580px;\">
          <tr>
            <td style=\"background:linear-gradient(90deg,#7B3FBF,#C9A84C,#7B3FBF);height:3px;\"></td>
          </tr>
          <tr>
            <td style=\"padding:40px 40px 30px;text-align:center;border-bottom:1px solid rgba(123,63,191,0.12);\">
              <img src=\"https://media.base44.com/images/public/user_69f4a60c5f6a1719d380566c/86d4247bb_2_2.png\"
                width=\"56\" height=\"56\" alt=\"Братоуверие-СНБ\" style=\"display:block;margin:0 auto 16px;border-radius:12px;\" />
              <p style=\"margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#C9A84C;\">Братоуверие-СНБ</p>
              <h1 style=\"margin:12px 0 8px;font-size:24px;font-weight:800;color:#F8FAFC;\">Заполнение анкеты кандидата</h1>
              <p style=\"margin:0;font-size:14px;color:#F8FAFC]/60;\">Ваша анкета готова к заполнению</p>
            </td>
          </tr>
          <tr>
            <td style=\"padding:40px;\">
              ${candidate_name ? `<p style=\"margin:0 0 20px;font-size:16px;color:#F8FAFC;\">Здравствуйте, <strong>${candidate_name}</strong>!</p>` : ''}
              <p style=\"margin:0 0 16px;font-size:15px;color:#F8FAFC]/80;line-height:1.7;\">
                Просим вас заполнить онлайн-анкету кандидата. Заполнение займёт около 10 минут.
              </p>
              <div style=\"text-align:center;margin:28px 0;\">
                <a href=\"${form_url}\" style=\"display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#7B3FBF,#8B4FCF);color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;box-shadow:0 4px 20px rgba(123,63,191,0.35);\">Заполнить анкету</a>
              </div>
              <p style=\"margin:0 0 12px;font-size:13px;color:#F8FAFC]/50;\">Или перейдите по ссылке:</p>
              <p style=\"margin:0;font-size:13px;color:#7B3FBF;word-break:break-all;\"><a href=\"${form_url}\" style=\"color:#7B3FBF;text-decoration:none;\">${form_url}</a></p>
            </td>
          </tr>
          <tr>
            <td style=\"padding:20px 40px;border-top:1px solid rgba(123,63,191,0.10);text-align:center;\">
              <p style=\"margin:0;font-size:11px;color:rgba(248,250,252,0.2);\">
                ООО «Братоуверие-СНБ» · <a href=\"https://bratouverie-snb.ru\" style=\"color:rgba(201,168,76,0.5);text-decoration:none;\">bratouverie-snb.ru</a>
              </p>
              <p style=\"margin:6px 0 0;font-size:10px;color:rgba(248,250,252,0.12);\">ИНН 2511135442 · Приморский край, г. Уссурийск, пер. Мирный, д.1</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: to.trim(),
      subject,
      body: htmlBody,
      from_name: 'Братоуверие-СНБ',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});