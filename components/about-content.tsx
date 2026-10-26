export function AboutContent() {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html:
          '<section class="person" id="kerry">\n  <div class="wrap pgrid">\n    <div class="portrait rv" id="portrait" role="img" aria-label="Portrait placeholder illustration"><img src="/illustrations/portrait.svg" alt="Abstract portrait illustration, not a likeness" style="width:100%;height:100%"><div class="cap">Portrait placeholder \u00b7 to be replaced with an environmental portrait</div></div>\n    <div class="rv">\n      <span class="eyebrow">Principal Broker</span>\n      <h2>Kerry <em>Ellison</em></h2>\n      <p class="big">Licensed since 1994. She has guided clients through changing markets, economic cycles and life transitions with steady expertise.</p>\n      <p>Kerry is an owner in her Keller Williams Market Center and has served on its Agent Leadership Council for most of her time with the company. Her approach is simple: slow the process down enough that every decision feels like yours.</p>\n      <div class="timeline">\n        <div><b>1994</b><span>Licensed</span></div>\n        <div><b>33+</b><span>Years of experience</span></div>\n        <div><b>1,131</b><span>Closed transactions</span></div>\n      </div>\n      <a class="btn solid" href="/contact">Schedule a consultation <span class="arrow">\u2192</span></a>\n      <div class="team">\n        <div><b>Angela Stowell</b><span>Executive Broker | Agent</span></div>\n        <div><b>James Kirk</b><span>REALTOR\u00ae</span></div>\n      </div>\n    </div>\n  </div>\n</section>',
      }}
    />
  );
}
