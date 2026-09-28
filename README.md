# 熊喵喵与肥狗 V5.2 · Render 免费联机服务器

此服务器用于替代国内网络经常无法直连的 `workers.dev`，支持创建房间、两人 WebSocket 同步、服务器权威物理、断线重连和 4 小时房间有效期。

## 手机部署

1. 在 GitHub 新建公开仓库 `little-adventurers-render`。
2. 把本 ZIP 解压后的全部文件上传到仓库根目录并提交；所有必要代码都在根目录，不需要另外创建文件夹。
3. 登录 Render，使用 GitHub 登录，选择 **New → Web Service**。
4. 连接 `little-adventurers-render` 仓库。
5. Render 会读取 `render.yaml`；若需要手填：Runtime 选 Node，Build Command 填 `npm install`，Start Command 填 `npm start`，Instance Type 选 Free。
6. 部署完成后打开 Render 提供的 `https://xxx.onrender.com/api/health`，看到 `"protocol":5` 就成功。
7. 把不带 `/api/health` 的根地址 `https://xxx.onrender.com` 粘贴到 V5.2 游戏的服务器地址中。

免费服务闲置后会休眠，第一次开房可能等待约一分钟。房间只保存在当前运行实例的内存中；服务重启或休眠后旧房间会失效，重新创建即可。
