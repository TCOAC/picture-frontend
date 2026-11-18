# 云图库前端

Vue 3、TypeScript、Vite 和 Ant Design Vue。页面包括公共图库、上传/导入、审核队列、个人作品、图片详情与编辑、相似/颜色搜索、私有/团队空间、成员权限、分享和统计分析。

## 本地开发

```powershell
npm ci
npm run dev
```

Vite 默认将 `/api` 和 WebSocket 请求转发至 `http://127.0.0.1:8123`。可通过 `VITE_API_ORIGIN` 设置不同 API origin。后端请先启动并初始化 MySQL，见 [后端仓库](https://github.com/TCOAC/picture-backend)。

## 验证与部署

```powershell
npm run type-check
npm run build
npm run test:e2e
```

For a local Playwright run using the installed Google Chrome instead of a downloaded Playwright browser, set `$env:PLAYWRIGHT_CHANNEL='chrome'` before running `npm run test:e2e`.

Dockerfile 会构建静态站点，Nginx 为 `/api` 与 WebSocket 提供同源反代。与后端 Docker Compose 一起部署时，将两个仓库克隆到同一目录下的 `picture-backend`、`picture-frontend` 文件夹，在后端目录复制 `.env.example` 为 `.env` 并设置强 `DB_PASSWORD`，然后执行 `docker compose up --build`。

协作编辑、私有图片地址、管理页面仍由后端逐个请求校验。AI 编辑需要后端配置图像模型服务密钥。
