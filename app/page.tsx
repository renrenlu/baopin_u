"use client";

import { useMemo, useRef, useState } from "react";

type Issue = {
  date: string;
  title: string;
  summary: string;
  takeaway: string;
  category: string;
  topics: string[];
  size: string;
  accent: "lime" | "blue" | "peach" | "lavender";
};

const ISSUES: Issue[] = [
  {
    date: "2026-06-25",
    title: "日常好物与养生食品观察",
    summary: "从纯钛杯、厨房好物到飞鹤与食养产品，本期覆盖高频生活场景，适合观察“熟悉需求 + 明确使用动作”如何降低成交门槛。",
    takeaway: "日常品不用讲得复杂，先让用户看见它在生活里解决了什么。",
    category: "综合选品",
    topics: ["纯钛杯", "厨房好物", "食养产品"],
    size: "6.8 MB",
    accent: "blue",
  },
  {
    date: "2026-06-26",
    title: "母婴个护：驱蚊与儿童护理",
    summary: "补铁剂、润本驱蚊、袋鼠妈妈与儿童护肤集中出现。内容的共同点，是从家长的担心切入，再用具体使用场景完成信任建立。",
    takeaway: "母婴内容先回应担心，再给出低风险、易执行的解决办法。",
    category: "母婴个护",
    topics: ["润本驱蚊", "儿童护肤", "补铁剂"],
    size: "3.2 MB",
    accent: "peach",
  },
  {
    date: "2026-06-27",
    title: "个人护理爆品：痛点先行",
    summary: "这批是抖音个人护理近一周的爆品，按“最值得学的点”筛选。防蚊、洗护、安睡裤与清洁产品都用具体痛点抢到第一秒注意力。",
    takeaway: "不是靠流量，而是靠内容和选品；粉丝几千照样能爆。",
    category: "个人护理",
    topics: ["防蚊网", "安睡裤", "清洁好物"],
    size: "5.2 MB",
    accent: "lavender",
  },
  {
    date: "2026-06-28",
    title: "美妆爆品：让效果先被看见",
    summary: "这批是抖音美妆近一周的爆品。美妆有一个鲜明共性：一半以上的爆款赢在画面，不在文案，妆前妆后和单边脸对比就是最强说服力。",
    takeaway: "美妆带货，能让人看到的，就别只让人听到。",
    category: "美妆",
    topics: ["假睫毛", "高光", "眉笔"],
    size: "4.8 MB",
    accent: "peach",
  },
  {
    date: "2026-06-29",
    title: "夏日出行与家居清凉好物",
    summary: "车载香薰、帽子夹、老粗布凉席与一次性浴巾，集中回应夏日出行和居家清凉需求。小物件靠便利性与价格感知快速成交。",
    takeaway: "季节品要把使用时刻说清楚，让用户立刻代入下一次出门或入睡。",
    category: "家居出行",
    topics: ["帽子夹", "凉席", "一次性浴巾"],
    size: "3.7 MB",
    accent: "blue",
  },
  {
    date: "2026-06-30",
    title: "食饮滋补：日常场景里的成交",
    summary: "藕节芦根、苹果山楂水、牛奶与儿童奶酪等产品，以家庭饮食和换季照顾为场景，把抽象营养价值变成更容易理解的日常选择。",
    takeaway: "食饮内容先讲什么时候喝、谁来喝，再解释配方和价值。",
    category: "食品饮料",
    topics: ["藕节芦根", "苹果山楂水", "儿童奶酪"],
    size: "5.0 MB",
    accent: "lime",
  },
  {
    date: "2026-07-01",
    title: "养生轻饮：自律也要有场景",
    summary: "十三宝茶、元气铁与非遗食养内容并列出现。好内容没有停留在“养生”标签，而是把饮用、坚持和传统工艺放进真实生活。",
    takeaway: "自律不是口号，要被拆成一个看得见、做得到的日常动作。",
    category: "养生食饮",
    topics: ["十三宝茶", "元气铁", "非遗食养"],
    size: "5.0 MB",
    accent: "lime",
  },
  {
    date: "2026-07-02",
    title: "暑期内容：教辅与亲子沟通",
    summary: "字帖、九年级预习、暑假阅读与亲子沟通集中回应家长在假期里的真实焦虑。高效内容把“大目标”改写成每天可以执行的小任务。",
    takeaway: "教育内容先降低行动门槛，再让家长看见一个可持续的暑假计划。",
    category: "教育亲子",
    topics: ["暑假阅读", "九年级预习", "同步字帖"],
    size: "3.4 MB",
    accent: "blue",
  },
  {
    date: "2026-07-03",
    title: "母婴日用：低门槛的育儿安心感",
    summary: "宝宝牙膏、辅食、牛奶、棉柔巾和夏季洗护，覆盖新手爸妈一天中的多个照顾节点。卖点都被翻译成更省心、更卫生、更容易坚持。",
    takeaway: "母婴好物的价值，往往是让照顾动作更简单，让家长更安心。",
    category: "母婴用品",
    topics: ["宝宝牙膏", "辅食", "夏季洗护"],
    size: "4.8 MB",
    accent: "peach",
  },
  {
    date: "2026-07-04",
    title: "个护爆品：把痛感讲具体",
    summary: "驱蚊、除湿、儿童牙刷、剃须刀与牙膏，都从一个清晰可感的麻烦切入：蚊虫、潮湿、敏感或清洁不到位，再用演示完成解释。",
    takeaway: "刚需痛点强的时候，先把痛感讲到位，再补机制解释。",
    category: "个人护理",
    topics: ["儿童牙刷", "防蚊", "口腔护理"],
    size: "5.5 MB",
    accent: "lavender",
  },
  {
    date: "2026-07-05",
    title: "美妆测评：信任由验证产生",
    summary: "本期美妆工具与彩妆内容里，销冠粉扑测评不是硬夸产品，而是先怀疑、再验证、再反转，让测试过程代替口头承诺。",
    takeaway: "信任不是说出来的，是被测试过程做出来的。",
    category: "美妆测评",
    topics: ["粉扑测评", "底妆", "彩妆工具"],
    size: "5.5 MB",
    accent: "peach",
  },
  {
    date: "2026-07-06",
    title: "家居小物：从省事到情绪价值",
    summary: "清洁用品、母婴小物、红旗摆件与重力眼罩跨越多个场景。选品虽杂，但都在“更省事”之外提供了安全感或情绪价值。",
    takeaway: "小商品要么明显省一步，要么准确补上一种情绪。",
    category: "家居好物",
    topics: ["清洁用品", "重力眼罩", "家居摆件"],
    size: "5.9 MB",
    accent: "blue",
  },
  {
    date: "2026-07-07",
    title: "食品饮料：先让用户想吃",
    summary: "夹心饼干、鲜花饼、菜籽油、奶粉与绿豆莲子羹，把口感画面、家庭餐桌和轻养生需求组合起来，先制造口欲，再交代配料。",
    takeaway: "食品第一秒先负责让人想吃，参数留到用户停下来以后再讲。",
    category: "食品饮料",
    topics: ["夹心饼干", "鲜花饼", "绿豆莲子羹"],
    size: "5.6 MB",
    accent: "lime",
  },
  {
    date: "2026-07-08",
    title: "滋补保健：先停留，再成交",
    summary: "辅酶 Q10、氨糖软骨素和酸梅汤代表三种成交路径。本期的共同核心是：爆品开头不是先把卖点讲完，而是先让用户愿意停下来。",
    takeaway: "开头先解决停留，再让卖点负责解释和成交。",
    category: "滋补保健",
    topics: ["辅酶 Q10", "氨糖", "酸梅汤"],
    size: "4.8 MB",
    accent: "lime",
  },
  {
    date: "2026-07-09",
    title: "教辅启蒙：把学习焦虑变行动",
    summary: "儿童物理启蒙、漫画初中理化与暑假三件事，分别用求知欲、降低理解门槛和每日计划承接家长焦虑。",
    takeaway: "开头先解决停留，再让清晰的学习动作负责解释和成交。",
    category: "教育亲子",
    topics: ["物理启蒙", "漫画理化", "暑假计划"],
    size: "4.6 MB",
    accent: "blue",
  },
  {
    date: "2026-07-10",
    title: "宠物与青少年护理的直观证据",
    summary: "猫抓板、青少年祛痘棉片与儿童冰沙霜都把产品效果做成可见证据：耐抓、肤况变化、晒后降温，让用户先看到结果。",
    takeaway: "用户先相信眼前的变化，再愿意听你解释产品。",
    category: "生活护理",
    topics: ["猫抓板", "祛痘棉片", "儿童冰沙霜"],
    size: "2.7 MB",
    accent: "lavender",
  },
  {
    date: "2026-07-11",
    title: "家居清洁：让结果成为钩子",
    summary: "去污膏、抽绳垃圾袋和大包装抽纸，用强烈的前后变化、极省事的动作和高性价比感承接家务痛点。",
    takeaway: "家居清洁先让结果说话，再解释为什么省力、为什么值得买。",
    category: "家居清洁",
    topics: ["去污膏", "抽绳垃圾袋", "抽纸"],
    size: "5.5 MB",
    accent: "blue",
  },
  {
    date: "2026-07-12",
    title: "美妆工具：变化比参数更有力",
    summary: "双头眼线胶笔、高光笔与固体唇蜜都围绕上脸变化、低门槛动作和真实对比展开，让“会不会用”比复杂参数更先被回答。",
    takeaway: "美妆开头先给用户一个能看见的变化，再让产品解释变化怎么发生。",
    category: "美妆",
    topics: ["眼线胶笔", "高光笔", "固体唇蜜"],
    size: "5.7 MB",
    accent: "peach",
  },
  {
    date: "2026-07-13",
    title: "家居日用：先看见问题被解决",
    summary: "紫外线消毒灯、保温杯与手机防水袋，分别解决母婴除菌、户外饮水和夏日玩水的明确问题，场景比材质参数更先出场。",
    takeaway: "家居日用的停留来自看见问题被解决，而不是听懂一个参数。",
    category: "家居日用",
    topics: ["消毒灯", "保温杯", "手机防水袋"],
    size: "5.7 MB",
    accent: "lavender",
  },
  {
    date: "2026-07-14",
    title: "食品饮料：先想吃，再解释",
    summary: "这组食品饮料案例把食欲画面、动作便利和家庭复购放在配料参数之前。坚果、瓜子仁和电解质水分别用口味反差、口欲和溯源制造停留。",
    takeaway: "食品饮料先让人想吃、看懂、敢买，再用参数解释为什么值得买。",
    category: "食品饮料",
    topics: ["每日坚果", "瓜子仁", "电解质水"],
    size: "6.1 MB",
    accent: "lime",
  },
  {
    date: "2026-07-15",
    title: "滋补保健：先讲处境，再补信任",
    summary: "镁钾微泡片、阿胶糕与燕窝粥，没有先硬讲功效，而是用疲惫、照顾关系和早餐场景把用户留住，再由规格与品牌补足信任。",
    takeaway: "滋补保健先讲用户处境和使用理由，再让规格、品牌和场景补信任。",
    category: "滋补保健",
    topics: ["镁钾微泡片", "阿胶糕", "燕窝粥"],
    size: "5.4 MB",
    accent: "lime",
  },
];

const MONTHS = ["2026-06", "2026-07"];
const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function formatDate(date: string, style: "long" | "short" = "long") {
  const [year, month, day] = date.split("-");
  return style === "short" ? `${Number(month)} 月 ${Number(day)} 日` : `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

function issueHref(issue: Issue) {
  return `${BASE_PATH}/pdfs/${issue.date.replaceAll("-", "")}.pdf`;
}

function issueTextHref(issue: Issue) {
  return `${BASE_PATH}/issues/${issue.date.replaceAll("-", "")}/`;
}

export default function Home() {
  const [monthIndex, setMonthIndex] = useState(MONTHS.length - 1);
  const [activeDate, setActiveDate] = useState(ISSUES[ISSUES.length - 1].date);
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const detailRef = useRef<HTMLElement>(null);
  const month = MONTHS[monthIndex];
  const [year, monthNumber] = month.split("-").map(Number);

  const monthIssues = useMemo(
    () => ISSUES.filter((issue) => issue.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date)),
    [month],
  );

  const visibleIssues = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return monthIssues;
    return monthIssues.filter((issue) =>
      [issue.title, issue.summary, issue.category, ...issue.topics].join(" ").toLowerCase().includes(keyword),
    );
  }, [monthIssues, query]);

  const activeIssue = ISSUES.find((issue) => issue.date === activeDate) ?? monthIssues[0];
  const availableDays = new Map(monthIssues.map((issue) => [Number(issue.date.slice(-2)), issue]));
  const firstWeekday = (new Date(year, monthNumber - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const calendarCells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1,
  );

  function chooseIssue(issue: Issue) {
    setActiveDate(issue.date);
    setSidebarOpen(false);
    if (window.innerWidth < 900) {
      window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  function changeMonth(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= MONTHS.length) return;
    const nextMonth = MONTHS[nextIndex];
    const nextIssues = ISSUES.filter((issue) => issue.date.startsWith(nextMonth)).sort((a, b) => b.date.localeCompare(a.date));
    setMonthIndex(nextIndex);
    setActiveDate(nextIssues[0].date);
    setQuery("");
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="每日爆品讯息首页">
          <span className="brand-mark" aria-hidden="true">爆</span>
          <span className="brand-name">每日爆品讯息</span>
          <span className="brand-note">DAILY SIGNAL</span>
        </a>
        <nav className="topnav" aria-label="主导航">
          <a className="active" href="#top">每日内参</a>
          <a href="#archive">本月归档</a>
          <a href="#insight">今日规律</a>
        </nav>
        <button
          className="mobile-menu"
          type="button"
          aria-label="打开期刊导航"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen((value) => !value)}
        >
          {sidebarOpen ? "×" : "☰"}
        </button>
      </header>

      <div className="workspace" id="top">
        <aside className={sidebarOpen ? "sidebar open" : "sidebar"} aria-label="期刊日期导航">
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、品类或产品…"
              aria-label="搜索本月期刊"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="清空搜索">×</button>
            )}
          </label>

          <section className="calendar" aria-label={`${year} 年 ${monthNumber} 月日历`}>
            <div className="month-switcher">
              <button
                type="button"
                onClick={() => changeMonth(monthIndex - 1)}
                disabled={monthIndex === 0}
                aria-label="上一个月"
              >
                ‹
              </button>
              <strong>{year} 年 {monthNumber} 月</strong>
              <button
                type="button"
                onClick={() => changeMonth(monthIndex + 1)}
                disabled={monthIndex === MONTHS.length - 1}
                aria-label="下一个月"
              >
                ›
              </button>
            </div>
            <div className="weekdays" aria-hidden="true">
              {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="calendar-grid">
              {calendarCells.map((day, index) => {
                if (day === null) return <span className="calendar-empty" key={`empty-${index}`} />;
                const issue = availableDays.get(day);
                return issue ? (
                  <button
                    className={activeDate === issue.date ? "has-issue selected" : "has-issue"}
                    type="button"
                    key={day}
                    onClick={() => chooseIssue(issue)}
                    aria-label={`查看 ${formatDate(issue.date)}期刊`}
                    aria-pressed={activeDate === issue.date}
                  >
                    {day}
                  </button>
                ) : <span className="no-issue" key={day}>{day}</span>;
              })}
            </div>
          </section>

          <section className="sidebar-issues">
            <div className="section-label">
              <span>本月各期</span>
              <b>{visibleIssues.length}</b>
            </div>
            <div className="issue-nav-list">
              {visibleIssues.map((issue) => (
                <button
                  className={activeDate === issue.date ? "issue-nav-item active" : "issue-nav-item"}
                  type="button"
                  key={issue.date}
                  onClick={() => chooseIssue(issue)}
                >
                  <span>{issue.title}</span>
                  <small>{formatDate(issue.date, "short")} · {issue.category}</small>
                </button>
              ))}
              {visibleIssues.length === 0 && (
                <div className="empty-search">没有找到相关期刊<br /><button type="button" onClick={() => setQuery("")}>清空搜索</button></div>
              )}
            </div>
          </section>

          <p className="sidebar-foot">已收录 {ISSUES.length} 期 · PDF 原文件</p>
        </aside>

        <section className="content" ref={detailRef}>
          <div className="content-inner">
            <div className="content-heading">
              <div>
                <span className="eyebrow">U 哥 · 每日爆品观察</span>
                <h1>每天看一组案例，<br />练一双<span>爆品眼睛</span>。</h1>
              </div>
              <p>从 PDF 到可检索、可回看的每日导读。<br />先读规律，再带着问题看案例。</p>
            </div>

            <article className={`featured-issue accent-${activeIssue.accent}`} aria-labelledby="active-issue-title">
              <div className="featured-main">
                <div className="issue-meta">
                  <span>{activeIssue.date.replaceAll("-", "")} 期</span>
                  <i />
                  <span>{activeIssue.category}</span>
                </div>
                <a id="active-issue-title" className="featured-title" href={issueTextHref(activeIssue)}>
                  {activeIssue.title}<span aria-hidden="true">↗</span>
                </a>
                <p className="featured-summary">{activeIssue.summary}</p>
                <div className="topic-row" aria-label="本期关键词">
                  {activeIssue.topics.map((topic) => <span key={topic}>{topic}</span>)}
                </div>
              </div>
              <aside className="takeaway-card" id="insight">
                <span>今日最该记住</span>
                <p>“{activeIssue.takeaway}”</p>
              </aside>
              <footer className="issue-actions">
                <div>
                  <span className="pdf-badge">PDF</span>
                  <p><strong>原刊已归档</strong><small>{activeIssue.size} · 在线阅读</small></p>
                </div>
                <div className="action-links">
                  <a className="secondary-action" href={issueHref(activeIssue)} download>
                    <span aria-hidden="true">↓</span> 下载 PDF
                  </a>
                  <a className="primary-action" href={issueHref(activeIssue)} target="_blank" rel="noreferrer">
                    打开原刊 <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </footer>
            </article>

            <section className="archive" id="archive" aria-labelledby="archive-heading">
              <div className="archive-heading">
                <div>
                  <span className="eyebrow light">MONTHLY ARCHIVE</span>
                  <h2 id="archive-heading">{year} 年 {monthNumber} 月 · 全部期刊</h2>
                </div>
                <span>{monthIssues.length} 期 / PDF 可下载</span>
              </div>
              <div className="archive-list">
                {monthIssues.map((issue, index) => (
                  <article className={`archive-item accent-${issue.accent}`} key={issue.date}>
                    <button className="archive-index" type="button" onClick={() => chooseIssue(issue)} aria-label={`切换到${formatDate(issue.date)}期刊`}>
                      {String(monthIssues.length - index).padStart(2, "0")}
                    </button>
                    <div className="archive-copy">
                      <div className="archive-meta">
                        <time dateTime={issue.date}>{formatDate(issue.date, "short")}</time>
                        <span>{issue.category}</span>
                      </div>
                      <a href={issueTextHref(issue)}>{issue.title}<span aria-hidden="true">↗</span></a>
                      <p>{issue.summary}</p>
                    </div>
                    <a className="download-icon" href={issueHref(issue)} download aria-label={`下载《${issue.title}》PDF`} title="下载 PDF">↓</a>
                  </article>
                ))}
              </div>
            </section>

            <footer className="site-footer">
              <p>每日爆品讯息 <span>·</span> 让案例随时可查，让规律反复可读。</p>
              <a href="#top">回到顶部 ↑</a>
            </footer>
          </div>
        </section>
      </div>
      {sidebarOpen && <button className="sidebar-backdrop" type="button" aria-label="关闭导航" onClick={() => setSidebarOpen(false)} />}
    </main>
  );
}
