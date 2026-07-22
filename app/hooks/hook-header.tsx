const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function HookHeader() {
  return (
    <>
      <header className="topbar">
        <a className="brand" href={`${BASE_PATH}/`} aria-label="返回每日爆品讯息首页">
          <span className="brand-mark" aria-hidden="true">爆</span>
          <span className="brand-name">每日爆品讯息</span>
          <span className="brand-note">HOOK PRACTICE</span>
        </a>
        <nav className="topnav" aria-label="主导航">
          <a href={`${BASE_PATH}/`}>爆品讯息</a>
          <a href={`${BASE_PATH}/gallery/social/`}>社会热点</a>
          <a href={`${BASE_PATH}/gallery/reading/`}>读书分享</a>
          <a href={`${BASE_PATH}/gallery/viral/`}>爆款裂变</a>
          <a className="active" href={`${BASE_PATH}/hooks/`}>钩子训练</a>
        </nav>
      </header>
      <nav className="gallery-mobile-tabs" aria-label="内容栏目">
        <a href={`${BASE_PATH}/`}>爆品讯息</a>
        <a href={`${BASE_PATH}/gallery/social/`}>社会热点</a>
        <a href={`${BASE_PATH}/gallery/reading/`}>读书分享</a>
        <a href={`${BASE_PATH}/gallery/viral/`}>爆款裂变</a>
        <a className="active" href={`${BASE_PATH}/hooks/`}>钩子训练</a>
      </nav>
    </>
  );
}
