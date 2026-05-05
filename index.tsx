import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { check, Update, DownloadEvent } from '@tauri-apps/plugin-updater';
import { relaunch, } from '@tauri-apps/plugin-process';

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

async function checkForUpdates() {
  // check() 返回 Update | null
  const update: Update | null = await check();

  if (update) {
    console.log(
      `found update ${update.version} from ${update.date} with notes ${update.body}`
    );

    let downloaded: number = 0;
    // contentLength 可能为 undefined (如果更新服务器未返回 Content-Length 响应头)
    let contentLength: number | undefined = 0;

    // alternatively we could also call update.download() and update.install() separately
    await update.downloadAndInstall((event: DownloadEvent) => {
      switch (event.event) {
        case 'Started':
          contentLength = event.data.contentLength;
          console.log(`started downloading ${event.data.contentLength} bytes`);
          break;
        case 'Progress':
          downloaded += event.data.chunkLength;
          console.log(`downloaded ${downloaded} from ${contentLength}`);
          break;
        case 'Finished':
          console.log('download finished');
          break;
      }
    });
    console.log('update installed');
    await relaunch();
  }
}

checkForUpdates()

const root = ReactDOM.createRoot(rootElement);
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
