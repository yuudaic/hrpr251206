// トリガーの設置忘れずに

function onFormSubmit(e) {
    const values = e.namedValues;

    // ========= ハニーポット判定 =========
    const hpKey = '入力不要'; // ←フォームの設問名と一致
    const honeypot = get_(values, hpKey);

    if (honeypot) {
        console.log('Honeypot triggered. Skip sending emails. value=', honeypot);

        // 迷惑が多いなら「自分だけ通知」ON（必要に応じて）
        notifySpam_(values, 'honeypot', honeypot);
        return;
    }

    // ========= 追加：スパム判定（★ここが本命） =========
    const spamReason = detectSpamReason_(values);
    if (spamReason) {
        console.log('Spam detected. Skip auto-reply. reason=', spamReason);

        // スパムは「自動返信しない」。必要なら自分にだけ通知
        notifySpam_(values, 'rule', spamReason);
        return;
    }
    // ================================================

    // 通常処理
    const company = get_(values, '会社名');
    const name = get_(values, 'お名前');
    const email = get_(values, 'メールアドレス');
    const tel = get_(values, '電話番号');
    const note = get_(values, 'ご相談内容');
    const notebook = get_(values, 'ご相談の詳細');

    const subject = '【人事広報】お問い合わせありがとうございます';
    const htmlBody =
        `${name} 様<br><br>
このたびはお問い合わせいただきありがとうございます。<br><br>

以下の内容で承りました。<br><br>

―――――――――――――――――<br>
会社名：${escapeHtml_(company)}<br>
ご担当者名：${escapeHtml_(name)}<br>
メールアドレス：${escapeHtml_(email)}<br>
電話番号：${escapeHtml_(tel)}<br>
ご相談内容：<br>${escapeHtml_(note).replace(/\n/g, '<br>')}<br>
ご相談の詳細：<br>${escapeHtml_(notebook).replace(/\n/g, '<br>')}<br>
―――――――――――――――――<br><br>

内容を確認のうえ、追ってご連絡いたします。<br><br>

<strong>人事広報 千葉雄大</strong><br>
<a href="mailto:info@yuudai.site">info@yuudai.site</a><br>
<a href="tel:09066882845">090-6688-2845</a>`;

    // 自動返信メール
    GmailApp.sendEmail(
        email,
        subject,
        'お問い合わせありがとうございます',
        {
            htmlBody: htmlBody,
            from: 'info@yuudai.site',
            name: '人事広報 千葉雄大',
            replyTo: 'info@yuudai.site'
        }
    );

    // 自分にも通知
    const myAddress = 'info@yuudai.site';
    const mysubject = '【お問い合わせ有り】' + company + ' ' + name + '様より';
    GmailApp.sendEmail(
        myAddress,
        mysubject,
        'ホームページから問い合わせがありました',
        {
            htmlBody: htmlBody,
            from: 'info@yuudai.site',
            name: '人事広報 千葉雄大',
            replyTo: 'info@yuudai.site'
        }
    );
}

/** ===== 共通：安全に値を取り出す ===== */
function get_(values, key) {
    return (values[key] && values[key][0]) ? String(values[key][0]).trim() : '';
}

/** ===== 追加：スパム判定ルール =====
 * 返り値：スパムなら「理由文字列」、通常なら ''（空）
 */
function detectSpamReason_(values) {
    const company = get_(values, '会社名');
    const name = get_(values, 'お名前');
    const email = get_(values, 'メールアドレス');
    const tel = get_(values, '電話番号');
    const note = get_(values, 'ご相談内容');
    const notebook = get_(values, 'ご相談の詳細');

    const text = [company, name, email, tel, note, notebook].join(' ');

    // 1) URL/ドメインが含まれる
    if (/(https?:\/\/|www\.|\.com|\.net|\.org|\.ru|\.cn|\.xyz|\.top|\.site)/i.test(text)) {
        return 'URL/ドメインっぽい文字が含まれる';
    }

    // 2) 文字数が極端（短すぎ/長すぎ）
    if (text.length < 8) return '本文が短すぎる';
    if (text.length > 2500) return '本文が長すぎる';

    // 3) 英数字率が高い（日本語問い合わせ前提で強い）
    const alnum = (text.match(/[A-Za-z0-9]/g) || []).length;
    if (text.length > 0 && (alnum / text.length) > 0.60) {
        return '英数字率が高すぎる';
    }

    // 4) ありがちな営業スパム語
    const badWords = ['seo', 'backlink', 'guest post', 'marketing', 'casino', 'loan', 'viagra', 'crypto', 'bitcoin'];
    const lower = text.toLowerCase();
    if (badWords.some(w => lower.includes(w))) {
        return 'スパム頻出ワードを含む';
    }

    // 5) メールアドレスが不自然（捨てアド系ドメインなど）
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'メール形式が不正';
    if (/(mailinator|guerrillamail|tempmail|10minutemail)/i.test(email)) return '捨てアドっぽい';

    return '';
}

/** ===== スパムを自分にだけ通知（任意） =====
 * 迷惑が多い時はONが便利。不要なら中身を空にしてOK。
 */
function notifySpam_(values, kind, reason) {
    const myAddress = 'info@yuudai.site';
    const company = get_(values, '会社名');
    const name = get_(values, 'お名前');
    const email = get_(values, 'メールアドレス');
    const note = get_(values, 'ご相談内容');

    const subject = `【スパム疑い:${kind}】${company} ${name}`;
    const body =
        `スパム判定で自動返信を停止しました。
理由: ${reason}

会社名: ${company}
名前: ${name}
メール: ${email}
内容: ${note}`;

    GmailApp.sendEmail(myAddress, subject, body);
}

/** ===== HTMLエスケープ（本文の安全性UP） ===== */
function escapeHtml_(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
