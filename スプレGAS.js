function onFormSubmit(e) {
    // e.namedValues から各項目を取り出し
    const values = e.namedValues;

    // ========= ハニーポット判定（★追加） =========
    // Googleフォームに追加した「ハニーポット用の設問名」に合わせる
    const hpKey = '入力不要';
    const honeypot = (values[hpKey] && values[hpKey][0]) ? values[hpKey][0].trim() : '';

    // ハニーポットに値が入っていたら「返信しない・通知しない」
    if (honeypot) {
        console.log('Honeypot triggered. Skip sending emails. value=', honeypot);

        // もし「自分にだけ通知したい」なら、下をONにする
        /*
        GmailApp.sendEmail(
          'info@yuudai.site',
          '【スパム疑い】フォーム送信（honeypot反応）',
          'honeypotに値が入っていました。スプレッドシートの該当行を確認してください。\n値: ' + honeypot
        );
        */
        return;
    }
    // ===========================================

    const company = values['会社名'][0];      // フォームの設問名に合わせる
    const name = values['お名前'][0];
    const email = values['メールアドレス'][0];
    const tel = values['電話番号'][0] || '';
    const note = values['ご相談内容'][0] || '';
    const notebook = values['ご相談の詳細'][0] || '';

    const subject = '【人事広報】お問い合わせありがとうございます';
    const htmlBody =
        `${name} 様<br><br>
  このたびはお問い合わせいただきありがとうございます。<br><br>

  以下の内容で承りました。<br><br>

  ―――――――――――――――――<br>
  会社名：${company}<br>
  ご担当者名：${name}<br>
  メールアドレス：${email}<br>
  電話番号：${tel}<br>
  ご相談内容：<br>${note}<br>
  ご相談の詳細：<br>${notebook}<br>
  ―――――――――――――――――<br><br>

  内容を確認のうえ、追ってご連絡いたします。<br><br>

  <strong>人事広報 千葉雄大</strong><br>
  <a href="mailto:info@yuudai.site">info@yuudai.site</a><br>
  <a href="tel:09066882845">090-6688-2845</a>
  `;

    // 自動返信メール
    GmailApp.sendEmail(
        email,
        subject,
        'お問い合わせありがとうございます', // ← 必須（body）
        {
            htmlBody: htmlBody,
            from: 'info@yuudai.site',     // エイリアス（送信元）
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
        'ホームページから問い合わせがありました', // ← 必須（body）
        {
            htmlBody: htmlBody,
            from: 'info@yuudai.site',     // エイリアス（送信元）
            name: '人事広報 千葉雄大',
            replyTo: 'info@yuudai.site'
        }
    );


    // 自分にも通知
    // const myAddress = 'info@yuudai.site';
    // GmailApp.sendEmail(
    // myAddress,
    // '【トップページ問い合わせ】' + company + ' ' + name + '様より',
    // 'フォーム通知（テキスト版）',
    // { htmlBody: htmlBody }
    // );



    // // 自動返信メール
    // GmailApp.sendEmail({
    //   to: email,
    //   subject: subject,
    //   htmlBody: htmlBody,
    //   from: 'info@yuudai.site',          
    //   name: '人事広報 千葉雄大',                     
    //   replyTo: 'info@yuudai.site'       

    // });

    // // 自分にも通知したい場合
    // const myAddress = 'info@yuudai.site';
    // GmailApp.sendEmail({
    //   to: myAddress,
    //   subject: '【トップページ問い合わせ】' + company + ' ' + name + '様より',
    //   htmlBody: htmlBody
    // });
}
