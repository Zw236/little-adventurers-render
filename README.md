# 熊喵喵 V7 · Render 联机服务器

V7 使用协议 7。先更新服务器，再上传 V7 Netlify 前端，两位玩家都刷新到 V7 后重新建房。

## 手机更新现有服务器

1. 下载并解压「熊喵喵_V7_Render联机服务器.zip」。
2. 打开现有 GitHub 仓库 `Zw236/little-adventurers-render`，上传解压后的 `core.js`、`server.js`、`package.json`、`package-lock.json`，覆盖根目录的同名文件并提交。不要把 ZIP 本身上传到仓库。`README.md` 可一起更新；`render.yaml` 没有变化。
3. 等 Render 自动部署。没有自动开始时，打开对应 Web Service → **Manual Deploy → Deploy latest commit**。
4. 打开 `https://little-adventurers-render.onrender.com/api/health`。确认返回 `"ok":true`、`"protocol":7`、`"levels":24`、`"snapshotHz":30`。
5. 将「熊喵喵_V7_Netlify游戏前端.zip」上传到原来的 Netlify 项目。游戏里的服务器地址继续填写 `https://little-adventurers-render.onrender.com`。
6. 两位玩家刷新游戏，确认页面显示 V7，重新创建房间。

房间存在服务器内存里，更新或重启服务器后需要重新建房。原来的 Netlify 网址和同一浏览器里的闯关存档继续使用。V6 前端不能连接 V7 服务器。

## 本版联机变化

自己的移动、跳跃先在手机上响应，再按服务器状态校正；队友使用平滑插值。服务器仍决定碰撞、伤害和通关结果。同步频率从 20 次/秒提高到 30 次/秒，减少重复发送的数据；断线会暂停房间，同一玩家重连后恢复。游戏显示实测往返延迟（ms）。

这会改善操作手感，不能消除玩家和服务器之间的物理网络延迟。双人机关、救援等互动仍受网络延迟影响。

## 玩家仍反馈延迟时

- 先记下两位玩家游戏里显示的 ms，分别试一次 Wi-Fi 和手机流量。只看一位玩家的数据不能判断队友的线路。
- 只在第一次进入时等待很久：免费 Render 服务闲置后可能休眠，唤醒通常需要约一分钟。正在对局时持续高 ms，应继续检查线路和服务器区域。
- 持续高 ms：在 Render 查看当前服务的区域。可以先创建一个 **Singapore（新加坡）** 的测试服务，连接同一 GitHub 仓库，让两位玩家在游戏里填写新的 HTTPS 服务地址比较 ms。实际是否更快以玩家测量为准。
- Render 现有服务不能直接修改区域，需要新建服务迁移。测试地址确定后，两位玩家必须使用同一个服务器地址才能加入同一房间。
- 付费实例可以避免免费服务的休眠；跨区域线路慢时，付费本身不保证降低往返延迟。

Render 官方说明：[免费服务](https://render.com/docs/free) · [服务器区域](https://render.com/docs/regions)。

## 本地运行

Node.js 20 或更新版本，执行 `npm install` 后执行 `npm start`。默认端口 10000；托管平台可通过 `PORT` 设置端口。

`ALLOWED_ORIGINS` 可填写逗号分隔的其他前端来源；默认允许 HTTPS Netlify 子域名。`SERVER_REGION` 可填写用于健康检查显示的区域名称；它只是标签，不会迁移服务器。
