# Windows 本地运行与手机访问

适用范围：FITNESS OS PHASE 1.1；不需要Supabase、AI Key或付费服务。以下是运行步骤，当前云端无法替你验证实际Windows/Wi-Fi/防火墙。网页普通访问与PWA安装分别说明。

## 1. 取得版本

本交付分支包含完整PHASE 1.1代码。请clone `delivery/fitness-os-phase1-1`；main保留已有文档，不包含这次完整工程。保存代码到GitHub不等于已经部署网站。

```powershell
git clone --single-branch --branch delivery/fitness-os-phase1-1 https://github.com/123kai453/gpt.git FITNESS-OS-PHASE1-1
Set-Location .\FITNESS-OS-PHASE1-1\fitness-os-2.0
```

如果仓库是私有仓库，使用Git Credential Manager或GitHub官方登录流程授权，不在聊天发送密码或token。若电脑已经有同名目录，换一个新目录名，不要覆盖旧项目。

## 2. 工具与安装

安装Node.js 24.x（本次云环境24.19.0；项目要求>=24且<25）与Git for Windows，然后重新打开PowerShell：

```powershell
node --version
npm --version
git --version
npm install --global pnpm@11.25.0
pnpm --version
pnpm install --frozen-lockfile
```

只使用pnpm-lock.yaml，不另跑npm install/yarn install来生成其他锁文件。首次安装需联网访问官方软件包源；保留TLS和锁文件完整性校验。不要把Linux的node_modules复制到Windows，必须在Windows重新安装。

## 3. 电脑浏览器打开

开发模式：

```powershell
pnpm dev
```

等待Ready后，在运行该命令的Windows电脑浏览器输入 `http://localhost:3000`。这是电脑本地地址，不是公网预览。终端保持开启，Ctrl+C停止服务。

验证生产构建及基础PWA时，先停止开发服务器，再执行：

```powershell
pnpm build
pnpm start
```

仍在电脑浏览器打开同一地址。服务监听0.0.0.0，允许其他可达设备通过电脑IP访问。生产模式在localhost安全上下文注册Service Worker；开发模式刻意不注册离线缓存。

## 4. 同一Wi-Fi的手机访问

1. 手机与电脑连同一个可信Wi-Fi；不要用访客网络或开启客户端隔离的网络。
2. Windows执行 `ipconfig`，找到当前Wi-Fi或以太网适配器的IPv4地址。不要选WSL、VPN或虚拟网卡地址。
3. 手机浏览器输入 `http://<电脑实际IPv4地址>:3000`，将占位符换成刚查到的IP。此地址由你电脑的实际网络决定，本报告不编造IP。
4. 若Windows提示Node.js联网权限，只允许可信的“专用网络”；不要关闭整个防火墙，也不需要路由器公网端口映射。

如需手动放行，可先把可信家庭Wi-Fi设为“专用网络”，再在管理员PowerShell添加限定当前局域网的入站规则：

```powershell
New-NetFirewallRule -DisplayName "FITNESS OS local preview" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Profile Private -RemoteAddress LocalSubnet
```

用完可删除本条规则：

```powershell
Remove-NetFirewallRule -DisplayName "FITNESS OS local preview"
```

防火墙命令只在确有需要且你了解当前网络时执行；本次未远程修改你电脑的网络设置。

## 5. 访问失败排查

- 电脑localhost也打不开：确认终端未关闭、出现Ready、无构建错误；`Test-NetConnection localhost -Port 3000`。
- 3000被占用：先停止自己启动的旧实例；或 `pnpm dev --port 3001` / `pnpm start --port 3001`，电脑和手机改相同端口，防火墙规则也要对应修改。不要结束不明进程。
- 电脑能开、手机不能：核对实际IPv4、同Wi-Fi、防火墙专用网络、访客隔离及VPN影响；IP变化后更新手机地址。
- 单位网络阻止设备互访：需网络管理员允许，应用无法绕过网络隔离。
- 私有仓库clone失败：检查GitHub官方登录和仓库授权，不关闭TLS或向聊天发送token。

## 6. 手机PWA边界

手机通过普通局域网HTTP可浏览网页，但通常不属于安全上下文，Service Worker和安装能力可能不可用。这不是业务页面访问失败。当前不声称已验证iPhone Safari真实安装。

电脑localhost生产模式可以验证基础PWA；手机完整PWA安装/离线验证需要可信HTTPS入口或后续正式部署。当前没有公网发布，也不以关闭浏览器安全限制来替代HTTPS。
