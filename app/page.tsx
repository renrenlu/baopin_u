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
  {
    date: "2026-07-16",
    title: "图书教育：让学习安排更可执行",
    summary: "今天这组图书教育案例先看一件事:开头要先圈清年龄、年级或学习场景,再给家长一个可执行的选择理由。",
    takeaway: "图书教育卖的不是书名,而是家长此刻能理解、能执行、敢相信的学习安排。",
    category: "图书教育",
    topics: ["初升高暑假预习","课本里的百科全书","初中字帖"],
    size: "5.7 MB",
    accent: "blue",
  },
  {
    date: "2026-07-17",
    title: "图书教育：让学习安排更可执行",
    summary: "今天这组母婴宠物案例先看一件事:开头要把家长或铲屎官的具体担心拍出来,再给产品进入的理由。",
    takeaway: "母婴宠物要先让照顾者觉得“这和我家有关”,再谈产品。",
    category: "图书教育",
    topics: ["英氏双萃凝露春夏儿童宝宝面霜补…","babycare随行8件套紫盖…","宠物冰垫夏天防暑猫咪垫凉窝撕不…"],
    size: "6.2 MB",
    accent: "blue",
  },
  {
    date: "2026-07-18",
    title: "美妆个护：让效果先被看见",
    summary: "今天这组个人护理案例先看一件事:用户会为真实痛点、即时变化和生活场景停留,参数只能放在后面补信任。",
    takeaway: "个人护理不要先堆成分,先让用户看到自己现在就有这个问题。",
    category: "美妆个护",
    topics: ["花臣【夏季舒爽】澳洲茶树精华安…","可⻨控油蓬松洗发水修护去屑养发…","双头固体唇蜜护唇显白水光感唇彩…"],
    size: "6.6 MB",
    accent: "peach",
  },
  {
    date: "2026-07-19",
    title: "美妆个护：让效果先被看见",
    summary: "今天这组美妆案例先看一件事:用户不是为工具参数停留,而是为上脸变化、低门槛动作和真实对比停留。",
    takeaway: "美妆开头先给用户一个能看见的变化,再让产品解释这个变化怎么发生。",
    category: "美妆个护",
    topics: ["BABI四色修容盘高光一体盘面…","柔感次抛清洁工具无菌面部清理粉…","肤归来肤归来白斑遮瑕膏遮盖液霜…"],
    size: "6.1 MB",
    accent: "peach",
  },
  {
    date: "2026-07-20",
    title: "家居日用：让问题解决过程可见",
    summary: "今天不把这组家居日用压成一种公式,先对照三条真实路径:防晒面罩的卖点直给、饮水机的动作自证、漱口杯的人群场景。",
    takeaway: "今天不要从家居日用倒推固定开头:防晒面罩用“一句话把产品最大卖点给讲完”;饮水机用“一捏出水动作钩”;漱口杯用“妈妈替孩子换杯钩”。三条分别依赖卖",
    category: "家居日用",
    topics: ["dukaka杜卡卡随饮防晒面罩…","纯净水桶支架压水器桶装水架子倒…","轻奢小狗家族304倒挂磁吸洗漱…"],
    size: "7.0 MB",
    accent: "lavender",
  },
  {
    date: "2026-07-21",
    title: "食品饮料：先制造食欲，再解释价值",
    summary: "今天不把这组食品饮料压成一种公式,先对照三条真实路径:【周黑鸭官方】正宗周黑鸭的结果变化、随爱一纸花约夏天精选户外的真实停留点、迷你布里手工营养高钙进口的动作自证。",
    takeaway: "今天不要从食品饮料倒推固定开头:【周黑鸭官方】正宗周黑鸭用“家人以为外卖的复刻结果钩”;随爱一纸花约夏天精选户外用“连续否认规格理由的反转钩”;迷",
    category: "食品饮料",
    topics: ["正宗周黑鸭⻧料4斤!鸭货黑鸭⻧…","随爱一纸花约夏天精选户外冷泡茉…","迷你布里手工营养高钙进口即食干…"],
    size: "7.3 MB",
    accent: "lime",
  },
  {
    date: "2026-07-22",
    title: "滋补保健：先讲处境，再补信任",
    summary: "今天不把滋补保健压成一种公式，而是对照三条真实路径：FoYes 蛋白粉的痛点后果、喜纯玉灵膏的动作自证，以及 ON 金标乳清的真实停留点。",
    takeaway: "不要从品类倒推固定开头：三条案例分别依赖痛点后果、动作自证和真实停留点，先找最强证据，再决定开场方式。",
    category: "滋补保健",
    topics: ["FoYes 蛋白粉", "喜纯玉灵膏", "ON 金标乳清"],
    size: "6.6 MB",
    accent: "lime",
  },
  {
    date: "2026-07-23",
    title: "图书教育：让学习安排更可执行",
    summary: "今天不把这组图书教育压成一种公式,先对照三条真实路径:漫画正版天工开物少儿儿童的人群场景、【全6册】了不起的大侦探的人群场景、人⺠日报【初中必背文言文的人群场景。",
    takeaway: "今天不要从图书教育倒推固定开头:漫画正版天工开物少儿儿童用“家长被孩子问住的共鸣钩”;【全6册】了不起的大侦探用“小话痨不是烦、而是聪明表现的身份",
    category: "图书教育",
    topics: ["漫画正版天工开物少儿儿童孩子看…","了不起的大侦探 2-6岁儿童逻…","人⺠日报【初中必背文言文+古诗…"],
    size: "6.4 MB",
    accent: "blue",
  },
  {
    date: "2026-07-24",
    title: "母婴用品：先回应担心，再建立信任",
    summary: "今天不把这组母婴宠物压成一种公式，先对照三条真实路径：暖腹安腹热灸肚兜的人群场景、德佑婴儿绵柔巾的动作自证、婴儿折叠洗澡盆的价格翻译。",
    takeaway: "今天不要从母婴宠物倒推固定开头：先判断案例依赖人群场景、动作自证还是价格翻译，再用最强证据决定开场方式。",
    category: "母婴用品",
    topics: ["暖腹安腹热灸肚兜", "德佑婴儿绵柔巾", "婴儿折叠洗澡盆"],
    size: "5.9 MB",
    accent: "peach",
  },
  {
    date: "2026-07-25",
    title: "家居日用：让问题解决过程可见",
    summary: "今天不把这组个人护理压成一种公式，先对照三条真实路径：水卫士油污净厨房重油污清洁剂的剧情冲突、【官旗正品】usmile 笑容加焕白清新牙膏的动作自证，以及水卫士油污净家庭装的人群场景。先看家庭冲突如何制造悬念，再看重口痛点如何触发自查，最后看家庭 Vlog 如何用关系和情绪留人。",
    takeaway: "今天不要从个人护理倒推固定开头：水卫士油污净用“为什么婚后女人抵触回婆家”的家庭冲突钩，usmile 用“牙缝黄臭软泥”的重口痛点钩，另一条水卫士油污净则用“女儿临走前帮妈妈打扫”的家庭 Vlog 钩。三条分别依赖剧情冲突、动作自证和人群场景；先找最强证据，再决定开场方式。",
    category: "家居日用",
    topics: ["水卫士油污净厨房重油污清洁剂油…","usmile笑容加焕白清新牙膏…","水卫士油污净厨房重油污清洁剂家…"],
    size: "6.0 MB",
    accent: "lavender",
  },
  {
    date: "2026-07-26",
    title: "美妆个护：让效果先被看见",
    summary: "今天不把这组美妆压成一种公式，先对照三条真实路径：【何泓姗同款】三资堂嘭嘭高光棒的动作自证、【缎光腮红】酵色欧若腮红的结果变化，以及 PAZT 护甲油猫眼笔的真实停留点。先看即时效果如何让产品自己说话，再看半脸对比如何把变化变成观察任务，最后看“一步胶笔一瓶顶三瓶”的真实需求如何留住用户。",
    takeaway: "今天不要从美妆倒推固定开头：三资堂嘭嘭高光棒用“立竿见影的画面展示产品效果”，酵色欧若腮红用“半脸收紧结果钩”，PAZT 护甲油猫眼笔用“真实停留点”。三条分别依赖动作自证、结果变化和真实需求；先找最强证据，再决定开场方式。",
    category: "美妆个护",
    topics: ["三资堂嘭嘭高光棒持妆丝滑水润不…","酵色欧若腮红S240锻光水光肌…","PAZT护甲油猫眼笔7合1美甲…"],
    size: "5.8 MB",
    accent: "peach",
  },
  {
    date: "2026-07-27",
    title: "家居日用：让问题解决过程可见",
    summary: "今天不把这组家居日用压成一种公式，先对照三条真实路径：红旗摆件的真实停留点、DEEX/电刻灵动 SE 水的剧情冲突、柳青线的真实停留点。",
    takeaway: "今天不要从家居日用倒推固定开头：三条案例分别依赖真实停留点和剧情冲突，先找最强证据，再决定开场方式。",
    category: "家居日用",
    topics: ["爱国红旗车载摆件", "DEEX 灵动 SE 过滤嘴", "柳青牌百搭缝纫线"],
    size: "6.7 MB",
    accent: "lavender",
  },
  {
    date: "2026-07-28",
    title: "食品饮料：先制造食欲，再解释价值",
    summary: "今天不把这组食品饮料压成一种公式，先对照三条真实路径：西奥图意大利面的人群场景、馋小乖藤椒素牛肉粒的真实停留点、东鹏特饮补水啦的价格翻译。",
    takeaway: "今天不要从食品饮料倒推固定开头：三条案例分别依赖暑假家庭做饭场景、食物拆包质地和品牌价格惊讶，先找最强证据，再决定开场方式。",
    category: "食品饮料",
    topics: ["西奥图意大利面", "馋小乖藤椒素牛肉粒", "东鹏特饮补水啦"],
    size: "6.9 MB",
    accent: "lime",
  },
  {
    date: "2026-07-29",
    title: "滋补保健：先讲处境，再补信任",
    summary: "今天不把这组滋补保健压成一种公式，先对照三条真实路径：喜纯椰香七白粉的真实停留点、宁之春六味地黄人参原浆饮的动作自证、fiboo 元气铁补剂的结果变化。",
    takeaway: "今天不要从滋补保健倒推固定开头：三条案例分别依赖治愈感画面、价格对打和健身平台期痛点，先找最强证据，再决定开场方式。",
    category: "滋补保健",
    topics: ["喜纯椰香七白粉", "宁之春六味地黄人参原浆饮", "fiboo 元气铁补剂"],
    size: "6.1 MB",
    accent: "lime",
  },
  {
    date: "2026-07-30",
    title: "图书教育：让学习安排更可执行",
    summary: "今天不把这组图书教育压成一种公式,先对照三条真实路径:北京四中语文课:千古文章的人群场景、【新品半价】皮面家庭证件的剧情冲突、罗莎伯爵5929-精选-的真实停留点。",
    takeaway: "今天不要从图书教育倒推固定开头:北京四中语文课:千古文章用“北京四中校门加“语文神书”的名校信息差钩”;【新品半价】皮面家庭证件用““你又背着我买房",
    category: "图书教育",
    topics: ["北京四中语文课:千古文章精选1…","皮面家庭证件收纳包活⻚a4收纳…","罗莎伯爵5929-精选-按动中…"],
    size: "5.9 MB",
    accent: "blue",
  },
  {
    date: "2026-07-31",
    title: "母婴用品：先回应担心，再建立信任",
    summary: "今天不把这组母婴宠物压成一种公式，先对照三条真实路径：元气宠物狗狗元气蛋 mini 的人群场景、多可特白牛卡纸猫抓板猫窝的动作自证，以及它星球钠基矿砂 20 斤低粉的真实停留点。先看萌宠剧情如何圈定人群，再看近景破坏测试如何让产品自己证明，最后看真实门店搬货场景如何承接购买判断。",
    takeaway: "今天不要从母婴宠物倒推固定开头：元气宠物狗狗元气蛋 mini 用“让边牧自己决定拿几个的萌宠剧情钩”，多可特白牛卡纸猫抓板猫窝用“白牛卡猫窝近景破坏测试钩”，它星球钠基矿砂 20 斤低粉用“真实门店搬猫砂的场景钩”。三条分别依赖人群场景、动作自证和真实停留点；先找最强证据，再决定开场方式。",
    category: "母婴用品",
    topics: ["元气宠物狗狗元气蛋mini能量…","多可特白牛卡纸猫抓板猫窝耐抓不…","它星球钠基矿砂20斤低粉强吸水…"],
    size: "4.8 MB",
    accent: "peach",
  },
  {
    date: "2026-08-01",
    title: "美妆个护：让效果先被看见",
    summary: "今天不把这组个人护理压成一种公式,先对照三条真实路径:【重磅新品】usmile的动作自证、湿巾的真实停留点、【活动特惠】薇诺娜舒护安的动作自证。",
    takeaway: "今天不要从个人护理倒推固定开头:【重磅新品】usmile用“手抓羊肉开吃的生活画面钩”;湿巾用“用真实使用场景来加强产品的卖点”;【活动特惠】薇诺娜舒护",
    category: "美妆个护",
    topics: ["usmile笑容加冷光色修牙膏…","德佑冰感毛巾降温冰巾凉感夏季解…","薇诺娜舒护安肤睡眠面膜60g …"],
    size: "7.0 MB",
    accent: "peach",
  },
  {
    date: "2026-08-02",
    title: "美妆个护：让效果先被看见",
    summary: "今天不把这组美妆压成一种公式,先对照三条真实路径:木柯诗双头染眉膏眉笔防水的动作自证、【达人挂⻋】橘朵水缎光腮的真实停留点、【何泓姗同款】三资堂碎钻的动作自证。",
    takeaway: "今天不要从美妆倒推固定开头:木柯诗双头染眉膏眉笔防水用“新手染眉色换成柔光灰棕的半脸结果钩”;【达人挂⻋】橘朵水缎光腮用“粉质腮红拍出水缎光的材",
    category: "美妆个护",
    topics: ["木柯诗双头染眉膏眉笔防水防汗不…","橘朵水缎光腮红细闪低饱和水光肌…","三资堂碎钻睫毛膏一刷闪爆灵动碎…"],
    size: "6.9 MB",
    accent: "peach",
  },
  {
    date: "2026-08-03",
    title: "家居日用：让问题解决过程可见",
    summary: "今天不把这组家居日用压成一种公式,先对照三条真实路径:红旗摆件的动作自证、boxlamp星空灯语音的真实停留点、云感泡芙双层纱床笠三件套的结果变化。",
    takeaway: "今天不要从家居日用倒推固定开头:红旗摆件用“手持双旗摆件加“真这么灵”悬念钩”;boxlamp星空灯语音用““这星空壁画灯真的好用吗”反应式悬念钩”;云感",
    category: "家居日用",
    topics: ["⻋载摆件红旗中控台办公室摆件办…","boxlamp星空灯语音声控卧…","云感泡芙双层纱床笠三件套全包防…"],
    size: "6.2 MB",
    accent: "lavender",
  },
  {
    date: "2026-08-04",
    title: "食品饮料：先制造食欲，再解释价值",
    summary: "今天不把这组食品饮料压成一种公式,先对照三条真实路径:辣福星海苔味糯辣片甜辣辣的动作自证、【超值130包】三只松鼠的真实停留点、大王馋了多口味阳光青笋泡的真实停留点。",
    takeaway: "今天不要从食品饮料倒推固定开头:辣福星海苔味糯辣片甜辣辣用“近距离撕开糯辣片并拉出卷曲实物的画面钩”;【超值130包】三只松鼠用“橙色礼盒打开后先报",
    category: "食品饮料",
    topics: ["辣福星海苔味糯辣片甜辣辣条老式…","三只松鼠辣⻧大礼盒889g荤素…","大王馋了多口味阳光青笋泡椒竹笋…"],
    size: "7.6 MB",
    accent: "lime",
  },
  {
    date: "2026-08-05",
    title: "滋补保健：先讲处境，再补信任",
    summary: "今天不把这组滋补保健压成一种公式,先对照三条真实路径:fiboo她练爆料蛋白粉的结果变化、肌肉博士肌酸软糖90粒装的剧情冲突、ONEADAY拜耳男士复的真实停留点。",
    takeaway: "今天不要从滋补保健倒推固定开头:fiboo她练爆料蛋白粉用“先给出纤细腰腹,再抛出“常年维持88斤、放纵后怎”;肌肉博士肌酸软糖90粒装用“肌肉型真人举起",
    category: "滋补保健",
    topics: ["fiboo她练爆料蛋白粉高蛋白…","肌肉博士肌酸软糖90粒装橙子蓝…","ONEADAY拜耳男士复合型维…"],
    size: "7.1 MB",
    accent: "lime",
  },
  {
    date: "2026-08-06",
    title: "图书教育：让学习安排更可执行",
    summary: "今天不把这组图书教育压成一种公式,先对照三条真实路径:施柏德中油笔蓝色红笔速干的动作自证、【全套8册】2-8岁小熊的人群场景、中国孩子必知的历史典故3的人群场景。",
    takeaway: "今天不要从图书教育倒推固定开头:施柏德中油笔蓝色红笔速干用“先展示海外学习博主用A4纸写笔记的画面,再说“看”;【全套8册】2-8岁小熊用“米色动画卡",
    category: "图书教育",
    topics: ["施柏德中油笔蓝色红笔速干顺滑不…","2-8岁小熊多吉爱护自己系列绘…","中国孩子必知的历史典故300则…"],
    size: "6.5 MB",
    accent: "blue",
  },
  {
    date: "2026-08-07",
    title: "母婴用品：先回应担心，再建立信任",
    summary: "今天不把这组母婴宠物压成一种公式,先对照三条真实路径:MiNiMAX米迈思韩国的人群场景、宠物冰垫夏天防暑猫咪垫凉的动作自证、素又云感绒绒巾加厚洗脸巾的真实停留点。",
    takeaway: "今天不要从母婴宠物倒推固定开头:MiNiMAX米迈思韩国用“手从手提礼盒里抽出DHA小袋,字幕和口播说“妈妈”;宠物冰垫夏天防暑猫咪垫凉用“AI生成的猫咪",
    category: "母婴用品",
    topics: ["MiNiMAX米迈思韩国进口儿…","宠物冰垫夏天防暑猫咪垫凉窝撕不…","素又云感绒绒巾加厚洗脸巾周抛小…"],
    size: "6.6 MB",
    accent: "peach",
  },
  {
    date: "2026-08-08",
    title: "综合选品：从真实场景找到成交理由",
    summary: "今天不把这组个人护理压成一种公式,先对照三条真实路径:【迪丽热巴同款】德佑湿厕的真实停留点、bop波普专研色修美白牙的动作自证、【重磅新品】usmile 的人群场景。",
    takeaway: "今天不要从个人护理倒推固定开头:【迪丽热巴同款】德佑湿厕用“手从随身包里抽出一片独立湿厕纸,字幕和口播直说“”;bop波普专研色修美白牙用“口腔内部",
    category: "综合选品",
    topics: ["德佑湿厕纸小包独立装100片经…","bop波普专研色修美白牙膏活性…","usmile笑容加冷光色修牙膏…"],
    size: "6.7 MB",
    accent: "lavender",
  },
  {
    date: "2026-08-09",
    title: "美妆个护：让效果先被看见",
    summary: "今天不把这组美妆压成一种公式，先对照三条真实路径：漫步星球粉底液的剧情冲突、Doll 双眼皮贴的动作自证、puco 唇粉霜的人群场景。",
    takeaway: "今天不要从美妆倒推固定开头：漫步星球粉底液用“分屏亮出商家给我的和商家想要的，再拿梳子摩擦验货”；Doll 双眼皮贴用“第一秒夹起双眼皮贴直接妆后上眼”；puco 唇粉霜用“车内承诺不管怎么干饭都不掉色”。三条分别依赖剧情冲突、动作自证和人群场景，先找最强证据，再决定开场方式。",
    category: "美妆个护",
    topics: ["漫步星球粉底液商家反向验货实测…","肿眼泡双眼皮贴一步成双大外双…","puco唇粉霜黄皮显白年轻好几…"],
    size: "5.5 MB",
    accent: "peach",
  },
  {
    date: "2026-08-10",
    title: "家居日用：用实测代替承诺",
    summary: "今天不把这组家居日用压成一种公式，先对照三条真实路径：bimmer 温锦宏充气泵的异议对账、涛子开箱擦丝器的动作自证、小柠檬密封保鲜袋的人群场景。",
    takeaway: "今天不要从家居日用倒推固定开头：bimmer 温锦宏充气泵用“把粉丝提的要求念一遍，再在车边逐项实演”；涛子开箱擦丝器用“先放出西红柿削变形，再亮出均匀的细丝”；小柠檬密封保鲜袋用“装好早餐和水果直接拎走”。三条分别依赖异议对账、动作自证和人群场景，先找最强证据，再决定开场方式。",
    category: "家居日用",
    topics: ["粉丝提意见，我们尽量改！…","网红多功能擦丝器开箱，粗细薄片一键切换…","家里真的可以备上这种带提手的密封保鲜袋…"],
    size: "5.3 MB",
    accent: "blue",
  },
  {
    date: "2026-08-11",
    title: "食品饮料：把食欲拍在第一屏",
    summary: "今天不把这组食品饮料压成一种公式，先对照三条真实路径：大梨轻卡美食椒盐瓜子仁的动作自证、一只小马黄天鹅鸡蛋糕的真实停留点、芒星放映厅泉阳泉的剧情冲突。",
    takeaway: "今天不要从食品饮料倒推固定开头：大梨轻卡美食椒盐瓜子仁用“打开整罐瓜子仁，再把满满一把倒进手心贴近镜头”；一只小马黄天鹅鸡蛋糕用“手持咬开的鸡蛋糕高喊简直有毒啊姐妹们”；芒星放映厅泉阳泉用“你说好喝我不信，你说难喝我必须尝”。三条分别依赖动作自证、真实停留点和剧情冲突，先找最强证据，再决定开场方式。",
    category: "食品饮料",
    topics: ["一勺一勺挖着吃真的贼过瘾啊！…","黄天鹅也来卷小蛋糕了…","泉阳泉到底有多好喝啊！？！？…"],
    size: "5.3 MB",
    accent: "lime",
  },
  {
    date: "2026-08-12",
    title: "滋补保健：先讲处境，再补信任",
    summary: "今天不把这组滋补保健压成一种公式，先对照三条真实路径：小年高钙尔奇液体钙的动作自证、想吃绿化带镁钾微泡片的剧情冲突、常辰姐姐蛋白粉的真实停留点。",
    takeaway: "今天不要从滋补保健倒推固定开头：小年高钙尔奇液体钙用“整瓶胶囊倒进透明碗，喊25岁以上把补钙刻进DNA”；想吃绿化带镁钾微泡片用“顿顿重口却不忌口也能拿成绩的承诺冲突”；常辰姐姐蛋白粉用“39岁仍被认成大学生的外形反差”。三条分别依赖动作自证、剧情冲突和真实停留点，先找最强证据，再决定开场方式。",
    category: "滋补保健",
    topics: ["别的东西我不管，这个钙尔奇液体钙真的要…","不忌口还能拿成绩？高低我得试试…","37岁还被认为是大学生，保养自己的路上真…"],
    size: "3.8 MB",
    accent: "lime",
  },
  {
    date: "2026-08-13",
    title: "图书教育：先戳具体焦虑，再用实物承接",
    summary: "今天不把这组图书教育压成一种公式，先对照三条真实路径：荣妈好书分享同步作文的开学焦虑短剧情、彩虹糖杂货铺恐龙立体书的机关视觉震撼、小呆总一木林中性笔的开箱规模感。",
    takeaway: "今天不要从图书教育倒推固定开头：荣妈好书分享同步作文用“孩子带哭腔质问妈妈为什么不早点买”；彩虹糖的杂货铺恐龙立体书用“霸王龙、翼龙和火山连续弹起的超大3D机关”；小呆总一木林中性笔用“银色快递袋撕开、三盒黑白中性笔直接摊到镜头前”。三条分别依赖短剧情焦虑、机关视觉震撼和开箱规模感，先找最强证据，再决定开场方式。",
    category: "图书教育",
    topics: ["妈妈，三年级一开学就要写350字大作文了…","为什么和尚都是胖子、道士都是瘦子…","开学前不买笔袋的家长，你们嘴是真严…"],
    size: "6.0 MB",
    accent: "blue",
  },
  {
    date: "2026-08-14",
    title: "宠物母婴：先圈具体人群，再给确定答案",
    summary: "今天不把这组宠物母婴压成一种公式，先对照三条真实路径：憨憨猪大虫生物素冻干的拟人剧情、猫舍孙都懂驱虫滴剂的虫体特写、比熊小豆包儿润脚膏的问题部位放大。",
    takeaway: "今天不要从宠物母婴倒推固定开头：憨憨猪大虫生物素冻干用“穿月嫂服的猫与真实婴儿同框，工资按冻干结算”；猫舍孙都懂驱虫滴剂用“AI近景跳蚤蜱虫配‘我怕非泼罗尼’重复句式”；比熊小豆包儿润脚膏用“第一秒放大开裂肉垫，责问这心得多大”。三条分别依赖拟人剧情、虫体特写和问题部位放大，先找最强证据，再决定开场方式。",
    category: "宠物母婴",
    topics: ["别人家的月嫂几点下班我不知道，我们家这位…","我是跳蚤，我怕非泼罗尼；我是蜱虫，我…","狗爪子养成这样，这心得多大…"],
    size: "3.6 MB",
    accent: "peach",
  },
  {
    date: "2026-08-15",
    title: "个护家清：先说破低需求，再用画面自证",
    summary: "今天不把这组个护家清压成一种公式，先对照三条真实路径：七笙吖免手撕垃圾袋的先承认不缺、刘小辣黑头水的直播翻车预告、陈老三草酸浓缩液的分屏起泡实测。",
    takeaway: "今天不要从个护家清倒推固定开头：七笙吖免手撕垃圾袋用“双手撕开包装把多卷垃圾袋铺满纸箱，口播承认‘本来我也不缺垃圾袋’”；刘小辣黑头水用“开场露出反光板、补光灯和直播现场，大字提问‘大学生直播能捅多大篓子’”；陈老三草酸浓缩液用“上下分屏，下方把草酸溶液倒在重污砖面，液体迅速起泡冒烟”。三条分别依赖说破低需求、翻车预告和化学反应实测，先找最强证据，再决定开场方式。",
    category: "个护家清",
    topics: ["知道你们都不缺垃圾袋，可它真的好划算，还是免手撕的，用一个抽一个贼方便，加大加…","新版终于让我等到啦！ilso黑头水直降60，你一定要跟着我买#黑头 #护肤 #毛孔清洁 #韩…","这个草酸浓缩液真的好用吗？#草酸清洗剂 #草酸浓缩液 #马桶清洁剂 #测评"],
    size: "5.1 MB",
    accent: "blue",
  },
  {
    date: "2026-08-16",
    title: "美妆个护：先把变化拍出来，再教怎么复刻",
    summary: "今天不把这组美妆个护压成一种公式，先对照三条真实路径：万能小林子液体腮红的半弧画法、那咋了公主古早全包眼线的参考复刻、唐小曼Mandy漫步星球粉底液的翻车拆穿。",
    takeaway: "今天不要从美妆个护倒推固定开头：万能小林子液体腮红用“太阳穴到下颌画出醒目半弧腮红线，再用粉扑当场拍开”；那咋了公主古早全包眼线用“眼线笔对着眼周，叠出演唱会参考图现场落笔”；唐小曼Mandy漫步星球粉底液用“直播机位配‘35岁老登直播能捅出多大篓子’大字，再切粉底被刮花的画面”。三条分别依赖反常画法、参考复刻和翻车拆穿，先找最强证据，再决定开场方式。",
    category: "美妆个护",
    topics: ["有手就会的腮红画法简直不要太简单哈哈！…","谁说小眼睛画不成古早芭比 就这个哑光柔雾感…","控油，持妆，扒脸的夏天粉底液，一定是漫步星球…"],
    size: "6.2 MB",
    accent: "lavender",
  },
  {
    date: "2026-08-17",
    title: "家居日用：把最难的测试放在第一秒",
    summary: "今天不把这组家居日用压成一种公式，先对照三条真实路径：德文来啦仿刀切菜器的软食材挑战、两朵花测评趴睡枕的爆款复测、关关o0防油烟面罩的油点子可视化。",
    takeaway: "今天不要从家居日用倒推固定开头：德文来啦仿刀切菜器用“举着整块豆腐挑战切成丝，随即切出西红柿薄片”；两朵花测评趴睡枕用“先看手机里的爆款片段，再两人硬地板轮流实躺”；关关o0防油烟面罩用“戴黄色面罩站在冒油烟的炒锅前，做完一餐面罩布满油点子”。三条分别依赖食材挑战、爆款复测和问题可视化，先找最强证据，再决定开场方式。",
    category: "家居日用",
    topics: ["一键就能换档，这个仿刀切菜器真的好用吗？…","真实测评趴睡枕，真的舒服好用吗？…","做饭防油烟 #防油帽 #防油防溅面罩…"],
    size: "5.1 MB",
    accent: "lime",
  },
  {
    date: "2026-08-18",
    title: "食品饮料：先给动作和冲突，再讲味道",
    summary: "今天不把这组食品饮料压成一种公式，先对照三条真实路径：阿玉冰咖口香糖的大气泡动作、杰同学五色粗粮饭的自带米饭冲突、米娜吖MCT生酮咖啡的茶瓶混搭。",
    takeaway: "今天不要从食品饮料倒推固定开头：阿玉冰咖口香糖用“第一秒吹出半透明大气泡，再举起黑色颗粒特写”；杰同学五色粗粮饭用“餐厅里从自带包装拿出粗粮饭，被对面吐槽丢人”；米娜吖MCT生酮咖啡用“把咖啡条挤进喝过一口的东方树叶瓶，拧盖摇成浑浊饮品”。三条分别依赖动作证据、社交冲突和组合喝法，先找最强证据，再决定开场方式。",
    category: "食品饮料",
    topics: ["有着冰美式的香味，还冰冰凉凉的…","下班6点吃饭9点饿，半夜起来翻冰箱？…","解锁了一个夏日王炸喝法！生酮咖啡+东方树叶…"],
    size: "7.9 MB",
    accent: "blue",
  },
  {
    date: "2026-08-19",
    title: "健康养生：先用状态或价差留人，再谈成分",
    summary: "今天不把这组健康养生压成一种公式，先对照三条真实路径：谢蘑菇妈咪黄芪鲜阿胶的50岁妈妈状态、灰灰在这儿氨糖软骨素的整箱清货价、夏叔有好货赤小豆薏米茶的先教后卖。",
    takeaway: "今天不要从健康养生倒推固定开头：谢蘑菇妈咪黄芪鲜阿胶用“开场拍父母挽手出游，字幕抛出‘这是我50岁的妈妈’”；灰灰在这儿氨糖软骨素用“从整箱蓝瓶里拿起一瓶，口播报出将近300元一瓶的原价”；夏叔有好货赤小豆薏米茶用“铁锅铺满三种原料加水翻煮，先教完整自煮方法”。三条分别依赖状态反差、清货价差和知识前置，先找最强证据，再决定开场方式。",
    category: "健康养生",
    topics: ["不是岁月不败美人，而是美人自己会养…","3瓶更划算！进口高品质氨糖软骨素！…","三伏天都要喝这个赤小豆茯苓薏米茶？…"],
    size: "5.2 MB",
    accent: "peach",
  },
  {
    date: "2026-08-20",
    title: "图书文具：先把书变成一个动作，再谈价值",
    summary: "今天不把这组图书文具压成一种公式，先对照三条真实路径：托托手工彩色橡皮的反常弯折、彩虹糖小马宝莉立体书的城堡展开、叔叔鑫《唐诗》的限量编码。",
    takeaway: "今天不要从图书文具倒推固定开头：托托手工彩色橡皮用“手指第一秒就把橡皮用力掰弯，口播说‘能气哭熊孩子’”；彩虹糖小马宝莉立体书用“镜头第一秒把立体城堡从书页中完整展开”；叔叔鑫《唐诗》用“双手举起布面精装，强调全球限量5000套与独立珍藏编码”。三条分别依赖反常动作、立体视觉和稀缺身份，先找最强证据，再决定开场方式。",
    category: "图书文具",
    topics: ["终于找了不怕熊孩子的橡皮，擦字成线轻松省力不掉渣，用力也掰不断#开学必备#学习用…","展开近3米的小马宝莉梦幻立体书 小朋友简直喜欢到不行！#小马宝莉 #儿童读物 #童书推…","古籍社继《诗经》《楚辞》之后，终于蹲到同系列收藏力作《唐诗》 全球限量发行5000…"],
    size: "5.3 MB",
    accent: "lavender",
  },
  {
    date: "2026-08-21",
    title: "宠物母婴：先抛质疑或同屏对比，再给实测证据",
    summary: "今天不把这组宠物母婴压成一种公式，先对照三条真实路径：年糕爸儿童枕的榜单质疑、乔二二奶粉分装袋的价格前置、七喜是只小白狗除臭尿垫的同屏倒水。",
    takeaway: "今天不要从宠物母婴倒推固定开头：年糕爸儿童枕用“举出好评榜画面，口播问‘好评榜第一真有这么好’”；乔二二奶粉分装袋用“双手把绿色分装袋扇形铺开，口播对比‘9块10个’和‘8块9有30个’”；七喜是只小白狗除臭尿垫用“上下分屏把大量液体同时倒在普通尿垫与产品尿垫上”。三条分别依赖榜单质疑、价格数量前置和同屏对比，先找最强证据，再决定开场方式。",
    category: "宠物母婴",
    topics: ["睡眠方程式儿童枕｜两年实测硬核测评 宝睡得好才是真的好#儿童枕#孩子的枕头怎么选#…","妈妈出门再也不用拿着大桶奶粉了，有这个神器就够了","狗狗尿完就瞬间吸完的第三代椰壳炭除臭尿垫，尿一天家里一点异味也没有#成长日记…"],
    size: "4.5 MB",
    accent: "lime",
  },
  {
    date: "2026-08-22",
    title: "个护家清：先把怀疑说出来，再用过程回答",
    summary: "今天不把这组个护家清压成一种公式，先对照三条真实路径：阿炜测评头发纤维粉的“骗人视频”开场、猴哥的小生活美白牙膏的劳动者首挂、小柚子吖开学小方巾的蹭同桌尴尬。",
    takeaway: "今天不要从个护家清倒推固定开头：阿炜测评头发纤维粉用“先播一段遮秃视频并定义为‘骗人视频’，再把喷头对准自己真实头顶”；猴哥的小生活美白牙膏用“户外扛着沉重货袋，说‘身扛千斤，只为妻儿三餐无忧’”；小柚子吖开学小方巾用“书包旁铺满卡皮巴拉小方巾，说‘可别再让孩子舔着脸蹭同学纸巾’”。三条分别依赖先质疑再实测、人设信任和社交尴尬，先找最强证据，再决定开场方式。",
    category: "个护家清",
    topics: ["这款头发纤维粉真的好用吗？今天我们实测一下 #发际线粉 #纤维粉#发际线#头发稀疏 #…","身扛千斤只为妻儿三餐无忧，感谢大家信任 #bop美白牙膏 坚持用了一段时间真的好用…","熊孩子马上要开学了，我都是给他带这种小方巾去学校用，还是卡皮巴拉包装，熊孩子特…"],
    size: "5.9 MB",
    accent: "blue",
  },
  {
    date: "2026-08-23",
    title: "美妆彩妆：先点名圈住人，再把变化画在脸上",
    summary: "今天不把这组美妆彩妆压成一种公式，先对照三条真实路径：拾语传媒-花花腮红泥的肉肉脸点名、汇星投-棉棉修容盘的错误示范纠错、可可甜心椒粉扑的“A货/B货”公开质疑。",
    takeaway: "今天不要从美妆彩妆倒推固定开头：拾语传媒-花花腮红泥用“把低饱和腮红拍在单侧脸，点名‘面部留白大的肉肉脸女生’”；汇星投-棉棉修容盘用“手指夹住鼻梁示范错误修容，说‘修鼻影不是颜色越重越立体’”；可可甜心椒粉扑用“厚拍粉底并质问‘商家寄给我的A货，你们买到手的B货’”。三条分别依赖身份点名、错误示范和公开质疑，先找最强证据，再决定开场方式。",
    category: "美妆彩妆",
    topics: ["【到手9,9送手指粉扑】SweetMint奶芙糯糯腮红泥提升气色清透自然感","真好用的粉扑根本不需要作假！原相机一镜到底开测！#粉扑 #底妆 #韩女水光肌","【送鼻影修容刷】双色高光修容盘自然立体修颜显色粉质细腻一抹推荐"],
    size: "6.3 MB",
    accent: "peach",
  },
  {
    date: "2026-08-24",
    title: "家居日用：先给分数和结果，再让实测兜底",
    summary: "今天不把这组家居日用压成一种公式，先对照三条真实路径：俺叫玉笋宿舍床帘的打分加挂重物实测、谢中堡六件套的一屋子样品加30天试睡、钱兜兜切菜器的西红柿翻车测试。",
    takeaway: "今天不要从家居日用倒推固定开头：俺叫玉笋宿舍床帘用“快切装好的床帘和关灯画面，直接报‘承重95分、遮光95分’”；谢中堡六件套用“俯拍一屋子摊开的床垫，喊‘红榜来啦，测评团连续30天都在试睡’”；钱兜兜切菜器用“把西红柿压上切菜器直接推片，反问‘西红柿也能削吗’”。三条分别依赖先给分数、先晒筛选成本和先测最难样本，先找最强证据，再决定开场方式。",
    category: "家居日用",
    topics: ["谁家的满分床帘 #学生蚊帐 #康亨床帘 #床帘测评#宿舍床帘 #床帘推荐","柠檬舍友六件套测评～ 为了把红榜床垫测出来，我们不止要测床垫的密度，高度损失，…","最近爆火的一键切换档位多功能切菜器真的好用吗？#擦丝器#多功能擦丝器#切菜器 #厨…"],
    size: "5.5 MB",
    accent: "lavender",
  },
  {
    date: "2026-08-25",
    title: "食品零食：先点名谁来吃，再把吃法摆上桌",
    summary: "今天不把这组食品零食压成一种公式，先对照三条真实路径：零食干饭崽素烧玉米的夜间嘴馋点名、文竹呀牛腱肉配黄瓜的一周打卡、喵妹妹鹌鹑蛋的限购价格连比。",
    takeaway: "今天不要从食品零食倒推固定开头：零食干饭崽素烧玉米用“把玉米粒贴近镜头翻动，直接说‘这是给一到晚上就嘴馋的女孩子准备的’”；文竹呀牛腱肉用“一手黄瓜一手牛肉，边吃边报‘一拳牛肉一根黄瓜第三天、第五天、一个星期’”；喵妹妹鹌鹑蛋用“把多袋鹌鹑蛋举到脸旁，说‘怪不得一个手机只让薅一单’再连比三档价格”。三条分别依赖人群点名、连续打卡和价格算账，先找最强证据，再决定开场方式。",
    category: "食品零食",
    topics: ["宅家追剧嘴巴闲不住！这个素烧玉米越嚼越香，一口一个根本停不下来，解馋小零食就…","真不是因为天热不想开火。也不是因为低卡！而是卤香浸透到肉里，丝丝入味！筋连着肉…","鹌鹑蛋 #鹌鹑蛋#盐津铺子鹌鹑蛋 #QQ弹弹"],
    size: "6.3 MB",
    accent: "lime",
  },
  {
    date: "2026-08-26",
    title: "营养保健：先给判断标准，再让产品进场",
    summary: "今天不把这组营养保健压成一种公式，先对照三条真实路径：是阿瑞啊辅酶Q10的第一句报效期、李小草电解质的钾含量挑选标准、刘之冰纳豆激酶的夫妻日常剧情。",
    takeaway: "今天不要从营养保健倒推固定开头：是阿瑞啊辅酶Q10用“拆开保冷箱拿出两瓶，直接说‘临期又不是过期，27年11月到期’”；李小草电解质用“肌肉真人手持整瓶，第一句给‘好的电解质你得关注它钾的含量’”；刘之冰纳豆激酶用“熟龄夫妻客厅对话，‘你说的都对，咱俩谁对谁错无所谓’”。三条分别依赖效期透明、判断标准和关系剧情，先找最强证据，再决定开场方式。",
    category: "营养保健",
    topics: ["没想到这个价格就薅到了2瓶德国大品牌还原型辅酶Q10！#巨巨巨超值 #辅酶q10 #强烈…","专业好喝的性价比高的电解质","幸福是每天醒来能跟对方说声早安 #EGUOO #EGUOO纳豆激酶#情感#相敬茹冰#刘之冰"],
    size: "5.7 MB",
    accent: "blue",
  },
  {
    date: "2026-08-27",
    title: "文具图书：先让家长当场检验，再让产品接单",
    summary: "今天不把这组文具图书压成一种公式，先对照三条真实路径：橙子妈妈《观潮》自测页的考点压迫、数理视界科普剖面书的先列标准再证明、老余烧火了中性笔的家庭吐槽剧情。",
    takeaway: "今天不要从文具图书倒推固定开头：橙子妈妈学霸速记用“整屏《观潮》考点自测页，连续抛出时间、地点和中心句问题”；数理视界科普书用“翻出扶梯空调剖面图，先列‘内容扎实、不满页是字、孩子能自己看’三个条件”；老余烧火了中性笔用“一家人围桌写作业，妈妈吐槽‘写个作业哭什么，都烂尾楼了’”。三条分别依赖当场自测、标准清单和家庭冲突，先找最强证据，再决定开场方式。",
    category: "文具图书",
    topics: ["#四年级上册 第一课《观潮》知识点总结，这本#学霸速记 把一个学期需要掌握的重难点…","覆盖 9 到 99 岁全年龄段的科普经典，全家共读涨知识，解锁观察世界的全新视角 #科普 …","中性笔 这个中性笔书写流畅不断墨 孩子们写字都说这个笔好写#中性笔 #开学必备 #圆珠笔"],
    size: "5.0 MB",
    accent: "peach",
  },
  {
    date: "2026-08-28",
    title: "母婴儿童：先把开学入园场景摆上桌，再让产品接单",
    summary: "今天不把这组母婴儿童压成一种公式，先对照三条真实路径：万禧小铺粘耳棒的新奇工具演示、玲子带娃隔尿垫的入园尿床剧情、想想爱睡觉乳霜纸的开学蹭纸点名。",
    takeaway: "今天不要从母婴儿童倒推固定开头：万禧小铺粘耳棒用“透明粘耳头在手背上滚动，马上切到女孩侧脸演示”；玲子带娃隔尿垫用“妈妈抱孩子和整包寝具走出幼儿园，画外音问‘第一天就被表扬了？他尿床了吗’”；想想爱睡觉乳霜纸用“抽出一张纸横向展开，口播‘可别让孩子厚着脸用同学的纸巾了’”。三条分别依赖新奇工具演示、入园剧情反差和开学场景点名，先找最强证据，再决定开场方式。",
    category: "母婴儿童",
    topics: ["9月份上幼儿园的，妈妈们不想隔三差五洗床单被子的，一定要准备午睡用的隔尿垫，爱…","家人们，可以闭眼入啊，真是太解压了，这个粘耳棒真是太好用了，一点也不痛，小宝宝…","孩子开学建议妈妈们准备这个德佑小马乳霜纸给孩子带去学校用！纸张柔软亲肤，孩子用…"],
    size: "6.3 MB",
    accent: "lavender",
  },
];

const MONTHS = Array.from(new Set(ISSUES.map((issue) => issue.date.slice(0, 7)))).sort();
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
          <a className="active" href="#top">爆品讯息</a>
          <a href={`${BASE_PATH}/gallery/social/`}>社会热点</a>
          <a href={`${BASE_PATH}/gallery/reading/`}>读书分享</a>
          <a href={`${BASE_PATH}/gallery/viral/`}>爆款裂变</a>
          <a href={`${BASE_PATH}/hooks/`}>钩子训练</a>
          <a href={`${BASE_PATH}/hook-games/`}>钩子游戏</a>
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
      <nav className="gallery-mobile-tabs home-mobile-tabs" aria-label="内容栏目">
        <a className="active" href="#top">爆品讯息</a>
        <a href={`${BASE_PATH}/gallery/social/`}>社会热点</a>
        <a href={`${BASE_PATH}/gallery/reading/`}>读书分享</a>
        <a href={`${BASE_PATH}/gallery/viral/`}>爆款裂变</a>
        <a href={`${BASE_PATH}/hooks/`}>钩子训练</a>
        <a href={`${BASE_PATH}/hook-games/`}>钩子游戏</a>
      </nav>

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
