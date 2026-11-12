export class FakeCheckoutPage {
  static render(
    callbackUrl: string,
    referenceId: string,
    providerPaymentId: string,
  ): string {
    const escapeHtml = (value: string): string =>
      value.replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };

        return entities[character];
      });

    const safeCallbackUrl = escapeHtml(callbackUrl);
    const safeReferenceId = escapeHtml(referenceId);
    const safePaymentId = escapeHtml(providerPaymentId);

    return `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#090909" />
        <title>درگاه پرداخت آزمایشی | TMAR</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        <style>
          :root {
            color-scheme: dark;
            --bg: #090909;
            --panel: rgba(24, 24, 24, 0.94);
            --muted: #999999;
            --text: #ffffff;
            --accent: #FF8217;
            --border: rgba(255, 255, 255, .09);
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            min-height: 100vh;
            padding: 32px 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: "Vazirmatn", Tahoma, sans-serif;
            color: var(--text);
            background:
              radial-gradient(ellipse at 15% 15%, rgba(255, 130, 23, .12), transparent 40%),
              radial-gradient(ellipse at 85% 80%, rgba(255, 130, 23, .07), transparent 38%),
              var(--bg);
          }

          .ambient {
            position: fixed;
            width: 360px;
            height: 360px;
            border-radius: 50%;
            filter: blur(100px);
            opacity: .12;
            pointer-events: none;
          }

          .ambient.one {
            top: -180px;
            right: -100px;
            background: #FF8217;
          }

          .ambient.two {
            bottom: -180px;
            left: -100px;
            background: #FF8217;
          }

          .wrapper {
            position: relative;
            width: 100%;
            max-width: 470px;
          }

          .topbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 22px;
            padding: 0 4px;
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 11px;
          }

          .brand-icon {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            border-radius: 14px;
            color: white;
            font-size: 21px;
            font-weight: 800;
            background: linear-gradient(135deg, #FF9A42, #FF8217);
            box-shadow: 0 8px 28px rgba(255, 130, 23, .25);
          }

          .brand-name {
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 1px;
          }

          .brand-caption {
            margin-top: 1px;
            color: var(--muted);
            font-size: 10px;
          }

          .demo-badge {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 7px 11px;
            border: 1px solid rgba(255, 130, 23, .25);
            border-radius: 30px;
            color: #FF9A42;
            background: rgba(255, 130, 23, .08);
            font-size: 10px;
            font-weight: 700;
          }

          .demo-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #FF8217;
            box-shadow: 0 0 10px #FF8217;
          }

          .panel {
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 25px;
            background: var(--panel);
            box-shadow:
              0 35px 100px rgba(0,0,0,.42),
              inset 0 1px rgba(255,255,255,.04);
            backdrop-filter: blur(25px);
          }

          .panel-header {
            padding: 27px 28px 20px;
            text-align: center;
          }

          .secure-icon {
            width: 55px;
            height: 55px;
            margin: 0 auto 13px;
            display: grid;
            place-items: center;
            border: 1px solid rgba(255, 130, 23, .2);
            border-radius: 18px;
            color: #FF8217;
            background: rgba(255, 130, 23, .08);
          }

          .secure-icon svg {
            width: 26px;
            height: 26px;
          }

          h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 800;
          }

          .subtitle {
            margin: 7px 0 0;
            color: var(--muted);
            font-size: 12px;
          }

          .divider {
            height: 1px;
            background: var(--border);
          }

          .content {
            padding: 23px 28px 28px;
          }

          .section-label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 13px;
            color: #b4b4b4;
            font-size: 11px;
            font-weight: 600;
          }

          .section-label span:last-child {
            color: var(--muted);
            font-size: 10px;
          }

          .bank-card {
            position: relative;
            overflow: hidden;
            min-height: 175px;
            margin-bottom: 25px;
            padding: 20px;
            border: 1px solid rgba(255,255,255,.15);
            border-radius: 19px;
            background:
              radial-gradient(circle at 90% 10%, rgba(255,255,255,.13), transparent 30%),
              linear-gradient(125deg, #393939 0%, #202020 52%, #111111 120%);
            box-shadow: 0 15px 35px rgba(0, 0, 0, .35);
          }

          .bank-card::before {
            content: "";
            position: absolute;
            width: 230px;
            height: 230px;
            top: -125px;
            left: -70px;
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 50%;
            box-shadow:
              0 0 0 20px rgba(255,255,255,.025),
              0 0 0 42px rgba(255,255,255,.025);
          }

          .card-top,
          .card-bottom {
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .card-bank {
            font-size: 12px;
            font-weight: 700;
          }

          .card-type {
            padding: 4px 9px;
            border: 1px solid rgba(255,255,255,.25);
            border-radius: 30px;
            color: rgba(255,255,255,.8);
            font-size: 9px;
          }

          .chip {
            width: 36px;
            height: 27px;
            margin-top: 21px;
            border: 1px solid rgba(255,255,255,.45);
            border-radius: 6px;
            background:
              linear-gradient(90deg, transparent 47%, rgba(0,0,0,.12) 49%, transparent 52%),
              linear-gradient(0deg, transparent 47%, rgba(0,0,0,.12) 49%, transparent 52%),
              linear-gradient(135deg, #e4d5a3, #a88e59);
          }

          .card-number {
            margin-top: 14px;
            direction: ltr;
            text-align: right;
            font-size: 19px;
            font-weight: 700;
            letter-spacing: 2px;
          }

          .card-bottom {
            margin-top: 15px;
          }

          .card-meta-label {
            color: rgba(255,255,255,.62);
            font-size: 8px;
          }

          .card-meta-value {
            margin-top: 3px;
            font-size: 11px;
            font-weight: 700;
            direction: ltr;
          }

          .mastercard {
            display: flex;
            direction: ltr;
          }

          .mastercard i {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: rgba(255,255,255,.8);
          }

          .mastercard i + i {
            margin-left: -9px;
            background: rgba(255, 130, 23, .85);
          }

          .fields {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .field {
            min-width: 0;
            padding: 12px 13px;
            border: 1px solid var(--border);
            border-radius: 12px;
            background: rgba(255,255,255,.025);
          }

          .field-label {
            display: block;
            margin-bottom: 5px;
            color: var(--muted);
            font-size: 10px;
          }

          .field-value {
            display: block;
            color: #e5e5e5;
            font-size: 13px;
            font-weight: 700;
            direction: ltr;
            text-align: right;
            letter-spacing: 1px;
          }

          .amount-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 19px;
            padding: 15px;
            border: 1px solid rgba(255, 130, 23, .2);
            border-radius: 13px;
            background: rgba(255, 130, 23, .07);
          }

          .amount-label {
            color: #b4b4b4;
            font-size: 11px;
          }

          .amount-value {
            color: #FF9A42;
            font-size: 14px;
            font-weight: 800;
          }

          .actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 11px;
            margin-top: 21px;
          }

          button {
            min-height: 49px;
            border: 0;
            border-radius: 12px;
            font-family: inherit;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: transform .2s, filter .2s, box-shadow .2s;
          }

          button:hover {
            transform: translateY(-2px);
            filter: brightness(1.12);
          }

          button:active {
            transform: translateY(0);
          }

          .pay-button {
            color: #111111;
            background: linear-gradient(110deg, #FFA34F, #FF8217);
            box-shadow: 0 8px 22px rgba(255, 130, 23, .2);
          }

          .pay-button:hover {
            box-shadow: 0 10px 28px rgba(255, 130, 23, .3);
          }

          .cancel-button {
            border: 1px solid rgba(255,255,255,.12);
            color: #eeeeee;
            background: rgba(255,255,255,.05);
          }

          .demo-notice {
            display: flex;
            align-items: flex-start;
            gap: 9px;
            margin-top: 19px;
            padding: 12px;
            border: 1px solid rgba(255, 130, 23, .16);
            border-radius: 11px;
            color: #bbbbbb;
            background: rgba(255, 130, 23, .045);
            font-size: 10px;
            line-height: 1.9;
          }

          .demo-notice strong {
            color: #FF9A42;
          }

          .footer {
            padding: 17px 12px 0;
            color: #777777;
            text-align: center;
            font-size: 10px;
            line-height: 1.9;
          }

          .footer span {
            color: #FF8217;
            font-weight: 700;
          }

          @media (max-width: 390px) {
            .panel-header {
              padding: 23px 19px 18px;
            }

            .content {
              padding: 20px 19px 23px;
            }

            .card-number {
              font-size: 17px;
            }
          }
        </style>
      </head>

      <body>
        <div class="ambient one"></div>
        <div class="ambient two"></div>

        <main class="wrapper">
          <header class="topbar">
            <div class="brand">
              <div class="brand-icon">T</div>
              <div>
                <div class="brand-name">TMAR PAY</div>
                <div class="brand-caption">SECURE PAYMENT EXPERIENCE</div>
              </div>
            </div>

            <div class="demo-badge">
              <span class="demo-dot"></span>
              درگاه آزمایشی
            </div>
          </header>

          <section class="panel">
            <div class="panel-header">
              <div class="secure-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="4" y="10" width="16" height="11" rx="2"/>
                  <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
                  <path d="M12 14v3"/>
                </svg>
              </div>

              <h1>پرداخت اینترنتی</h1>
              <p class="subtitle">
                اطلاعات کارت بانکی خود را بررسی کنید
              </p>
            </div>

            <div class="divider"></div>

            <div class="content">
              <div class="section-label">
                <span>مشخصات کارت</span>
                <span>DEMO CARD</span>
              </div>

              <div class="bank-card">
                <div class="card-top">
                  <span class="card-bank">TMAR BANK</span>
                  <span class="card-type">SANDBOX</span>
                </div>

                <div class="chip"></div>

                <div class="card-number">
                  6037&nbsp;99XX&nbsp;XXXX&nbsp;1234
                </div>

                <div class="card-bottom">
                  <div>
                    <div class="card-meta-label">CARD HOLDER</div>
                    <div class="card-meta-value">TEST USER</div>
                  </div>

                  <div>
                    <div class="card-meta-label">EXPIRES</div>
                    <div class="card-meta-value">12 / 08</div>
                  </div>

                  <div class="mastercard">
                    <i></i><i></i>
                  </div>
                </div>
              </div>

              <div class="section-label">
                <span>اطلاعات پرداخت</span>
                <span>غیرقابل ویرایش</span>
              </div>

              <div class="fields">
                <div class="field">
                  <span class="field-label">شماره کارت</span>
                  <span class="field-value">6037 99XX XXXX 1234</span>
                </div>

                <div class="field">
                  <span class="field-label">CVV2</span>
                  <span class="field-value">•••</span>
                </div>

                <div class="field">
                  <span class="field-label">تاریخ انقضا</span>
                  <span class="field-value">12 / 08</span>
                </div>

                <div class="field">
                  <span class="field-label">رمز دوم</span>
                  <span class="field-value">••••••</span>
                </div>
              </div>

              <div class="amount-box">
                <span class="amount-label">مبلغ قابل پرداخت</span>
                <span class="amount-value">پرداخت آزمایشی</span>
              </div>

              <form method="POST" action="${safeCallbackUrl}">
                <input
                  type="hidden"
                  name="referenceId"
                  value="${safeReferenceId}"
                />
                <input
                  type="hidden"
                  name="providerPaymentId"
                  value="${safePaymentId}"
                />

                <div class="actions">
                  <button
                    class="pay-button"
                    type="submit"
                    name="status"
                    value="0"
                  >
                    تأیید و پرداخت
                  </button>

                  <button
                    class="cancel-button"
                    type="submit"
                    name="status"
                    value="1"
                  >
                    انصراف
                  </button>
                </div>
              </form>

              <div class="demo-notice">
                <span>ⓘ</span>
                <span>
                  <strong>محیط شبیه‌سازی پرداخت</strong><br />
                  این صفحه صرفاً برای تست سیستم طراحی شده است.
                  هیچ اطلاعات بانکی واقعی دریافت یا ذخیره نمی‌شود.
                </span>
              </div>
            </div>
          </section>

          <footer class="footer">
            اتصال امن شبیه‌سازی‌شده با <span>TMAR PAY</span><br />
            این درگاه واقعی نیست و تراکنش مالی انجام نمی‌دهد.
          </footer>
        </main>
      </body>
    </html>
    `;
  }
}
