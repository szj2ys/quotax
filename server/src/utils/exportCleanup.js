/**
 * Export Cleanup Job
 * 定期清理过期的导出文件
 */
const fs = require('fs');
const path = require('path');
const Export = require('../models/Export');

// 清理间隔（默认每小时检查一次）
const CLEANUP_INTERVAL = parseInt(process.env.EXPORT_CLEANUP_INTERVAL) || 60 * 60 * 1000;

/**
 * 清理过期的导出文件
 */
async function cleanupExpiredExports() {
  console.log('[Export Cleanup] 开始清理过期导出文件...');

  try {
    // 查找所有已过期的导出记录
    const expiredExports = await Export.findExpired();

    if (expiredExports.length === 0) {
      console.log('[Export Cleanup] 没有需要清理的过期文件');
      return;
    }

    console.log(`[Export Cleanup] 发现 ${expiredExports.length} 个过期文件需要清理`);

    let deletedCount = 0;
    let errorCount = 0;

    for (const exportRecord of expiredExports) {
      try {
        // 删除物理文件
        if (fs.existsSync(exportRecord.filePath)) {
          fs.unlinkSync(exportRecord.filePath);
          console.log(`[Export Cleanup] 已删除文件: ${exportRecord.filePath}`);
        }

        // 标记为已删除
        await exportRecord.markAsDeleted();
        deletedCount++;
      } catch (error) {
        console.error(`[Export Cleanup] 删除文件失败: ${exportRecord.filePath}`, error.message);
        errorCount++;
      }
    }

    console.log(`[Export Cleanup] 清理完成: 成功 ${deletedCount} 个, 失败 ${errorCount} 个`);
  } catch (error) {
    console.error('[Export Cleanup] 清理任务执行失败:', error);
  }
}

/**
 * 启动清理定时任务
 */
function startCleanupJob() {
  console.log('[Export Cleanup] 启动定时清理任务, 间隔:', CLEANUP_INTERVAL, 'ms');

  // 立即执行一次
  cleanupExpiredExports();

  // 设置定时任务
  const interval = setInterval(cleanupExpiredExports, CLEANUP_INTERVAL);

  // 返回清理函数，用于停止任务
  return {
    stop: () => {
      clearInterval(interval);
      console.log('[Export Cleanup] 定时清理任务已停止');
    }
  };
}

module.exports = {
  cleanupExpiredExports,
  startCleanupJob,
};
