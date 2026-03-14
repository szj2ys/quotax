/**
 * Digest Cron Job
 * 数据日报定时任务
 */
const { sendDigestBatch } = require('./digestService');

// 定时配置（可以通过环境变量覆盖）
const SCHEDULE_CONFIG = {
  daily: process.env.DIGEST_DAILY_HOUR || 9,    // 每天上午9点
  weekly: process.env.DIGEST_WEEKLY_DAY || 1,   // 每周一
  monthly: process.env.DIGEST_MONTHLY_DAY || 1  // 每月1号
};

// 存储定时任务引用
let jobs = {
  daily: null,
  weekly: null,
  monthly: null
};

/**
 * 获取下一个执行时间
 * @param {string} type - 任务类型 (daily/weekly/monthly)
 * @returns {Date}
 */
function getNextRunTime(type) {
  const now = new Date();
  const next = new Date(now);

  switch (type) {
    case 'daily':
      next.setHours(SCHEDULE_CONFIG.daily, 0, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;
    case 'weekly':
      next.setHours(SCHEDULE_CONFIG.daily, 0, 0, 0);
      const daysUntilMonday = (SCHEDULE_CONFIG.weekly - next.getDay() + 7) % 7;
      next.setDate(next.getDate() + daysUntilMonday);
      if (next <= now) {
        next.setDate(next.getDate() + 7);
      }
      break;
    case 'monthly':
      next.setHours(SCHEDULE_CONFIG.daily, 0, 0, 0);
      next.setDate(SCHEDULE_CONFIG.monthly);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      break;
  }

  return next;
}

/**
 * 执行日报任务
 */
async function runDailyDigest() {
  console.log('[Digest Cron] Running daily digest job at', new Date().toISOString());
  try {
    await sendDigestBatch('daily');
    console.log('[Digest Cron] Daily digest job completed');
  } catch (error) {
    console.error('[Digest Cron] Daily digest job failed:', error);
  }
  // 安排下一次执行
  scheduleJob('daily');
}

/**
 * 执行周报任务
 */
async function runWeeklyDigest() {
  console.log('[Digest Cron] Running weekly digest job at', new Date().toISOString());
  try {
    await sendDigestBatch('weekly');
    console.log('[Digest Cron] Weekly digest job completed');
  } catch (error) {
    console.error('[Digest Cron] Weekly digest job failed:', error);
  }
  // 安排下一次执行
  scheduleJob('weekly');
}

/**
 * 执行月报任务
 */
async function runMonthlyDigest() {
  console.log('[Digest Cron] Running monthly digest job at', new Date().toISOString());
  try {
    await sendDigestBatch('monthly');
    console.log('[Digest Cron] Monthly digest job completed');
  } catch (error) {
    console.error('[Digest Cron] Monthly digest job failed:', error);
  }
  // 安排下一次执行
  scheduleJob('monthly');
}

/**
 * 安排定时任务
 * @param {string} type - 任务类型
 */
function scheduleJob(type) {
  const nextRun = getNextRunTime(type);
  const delay = nextRun.getTime() - Date.now();

  console.log(`[Digest Cron] Scheduled ${type} digest for ${nextRun.toLocaleString('zh-CN')} (in ${Math.round(delay / 1000 / 60)} minutes)`);

  if (jobs[type]) {
    clearTimeout(jobs[type]);
  }

  jobs[type] = setTimeout(() => {
    switch (type) {
      case 'daily':
        runDailyDigest();
        break;
      case 'weekly':
        runWeeklyDigest();
        break;
      case 'monthly':
        runMonthlyDigest();
        break;
    }
  }, delay);
}

/**
 * 启动所有定时任务
 */
function startDigestJobs() {
  console.log('[Digest Cron] Starting digest cron jobs...');

  // 启动日报任务
  scheduleJob('daily');

  // 启动周报任务
  scheduleJob('weekly');

  // 启动月报任务
  scheduleJob('monthly');

  console.log('[Digest Cron] All digest jobs scheduled');
}

/**
 * 停止所有定时任务
 */
function stopDigestJobs() {
  console.log('[Digest Cron] Stopping all digest jobs...');
  Object.keys(jobs).forEach(type => {
    if (jobs[type]) {
      clearTimeout(jobs[type]);
      jobs[type] = null;
    }
  });
  console.log('[Digest Cron] All digest jobs stopped');
}

/**
 * 立即执行一次日报（用于测试）
 */
async function triggerDigestNow(period = 'daily') {
  console.log(`[Digest Cron] Triggering ${period} digest manually...`);
  return await sendDigestBatch(period);
}

module.exports = {
  startDigestJobs,
  stopDigestJobs,
  triggerDigestNow,
  getNextRunTime
};
