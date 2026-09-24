# 上线步骤

两件事：**接上 RSVP** 和 **把网页放上网**。各约十分钟，照着做就行。

---

## 第一部分 · 接上 RSVP（存进你的 Google Sheet）

做完之后，客人在网页上填的每一笔回覆，都会自动多一行在你的 Google Sheet 里。

### 1. 建一个 Google Sheet

到 [sheets.new](https://sheets.new) 开一个新试算表，改名叫「婚礼 RSVP」。

看一下网址列，中间那一长串就是 **Sheet ID**，先复制起来：

```
https://docs.google.com/spreadsheets/d/【这一整段就是 SHEET ID】/edit
```

### 2. 贴上后端程式

1. 在这个 Sheet 里点 **扩充功能 → Apps Script**
2. 把编辑器里原本的 `function myFunction() {}` 整段删掉
3. 打开本资料夹里的 `apps-script/Code.gs`，**全部复制贴上**
4. 找到第 10 行左右这一句，把引号里的字换成刚才复制的 Sheet ID：
   ```javascript
   var SHEET_ID = '在这里贴上你的 SHEET ID';
   ```
5. 按 💾 存档

### 3. 先测一次

在编辑器上方的函式下拉选单选 **`testWrite`**，按 **执行**。

第一次会跳出授权画面：**审查权限 → 选你的 Google 帐号 → 进阶 → 前往「未命名的专案」(不安全) → 允许**。
（这是 Google 对自己写的脚本的标准提示，因为程式是你自己贴的，没有经过 Google 审核。）

跑完回去看 Sheet，应该多了一行「测试」。看到了就成功，那行可以删掉。

### 4. 部署成网页应用程式

1. 右上角 **部署 → 新增部署作业**
2. 齿轮图示 ⚙️ → 选择 **网页应用程式**
3. 设定成：
   - 执行身份：**我**
   - 具有存取权的使用者：**任何人**　← 这项一定要选「任何人」，客人才送得出来
4. 按 **部署**，复制它给你的 **网页应用程式网址**（长得像 `https://script.google.com/macros/s/AKfyc.../exec`）

### 5. 填回网页

打开 `assets/js/config.js`，找到：

```javascript
rsvp: {
  endpoint: '',
```

把网址贴进引号里：

```javascript
rsvp: {
  endpoint: 'https://script.google.com/macros/s/AKfyc..../exec',
```

存档。**没贴之前，表单会自动改用 WhatsApp 送给你**，所以就算忘了贴也不会漏掉客人的回覆。

> 之后如果改了 `Code.gs`，记得要**重新部署**（部署 → 管理部署作业 → ✏️ → 版本选「新版本」→ 部署），
> 不然改的东西不会生效。网址不会变。

---

## 第二部分 · 放上 GitHub Pages

### 1. 建 repository

到 [github.com/new](https://github.com/new)：

- Repository name：`wedding`（随便取，会变成网址的一部分）
- 选 **Public**（Pages 免费版需要公开。页面已经加了 `noindex`，搜索引擎不会收录）
- 不要勾 "Add a README file"
- 按 **Create repository**

### 2. 上传档案

在新 repo 页面点 **uploading an existing file**，然后把这个资料夹里的**这些**拖进去：

```
index.html
assets/          （整个资料夹）
apps-script/     （选择性，只是留个备份）
SETUP.md         （选择性）
```

**不要上传 `photos/`** —— 那是 160MB 的原图，网页用不到（`.gitignore` 已经排除了，用 git 指令上传的话会自动跳过）。

拖完按 **Commit changes**。

### 3. 开启 Pages

**Settings → Pages**：

- Source：**Deploy from a branch**
- Branch：**main** / **/ (root)**
- 按 **Save**

等一两分钟，重新整理该页面，最上方会出现网址：

```
https://你的帐号.github.io/wedding/
```

**这就是要传给亲友的链接。**

### 4. 传出去之前，自己先跑一遍

- [ ] 手机打开，从头滑到尾，图都出得来
- [ ] 倒数天数对
- [ ] 「开启地图导航」按下去会开 Google Maps，位置是对的
- [ ] **填一笔假的 RSVP 送出**，回去 Sheet 看有没有进去（记得事后删掉那行）
- [ ] 「WhatsApp 联系」按下去会开对话框，号码没错

---

## 之后要改东西

| 想改什么 | 改哪里 |
|---|---|
| 日期、时间、地址、电话、RSVP 端点 | `assets/js/config.js` |
| 页面上的文字（故事、心里话那些） | `index.html`，找 `<!-- 文案 -->` 注解 |
| 换照片、换顺序 | `assets/js/config.js` 里的 `photos` 和 `layout` |
| 加新照片 | 丢进 `photos/`，跑 `./scripts/optimize-photos.sh`，再加进 `config.js` |
| 颜色、字级 | `assets/css/styles.css` 最上面的 `:root` |

改完重新上传到 GitHub，网址不变，一两分钟后就会更新。
