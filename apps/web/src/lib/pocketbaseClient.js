import Pocketbase from 'pocketbase';
import { toast } from 'sonner';

const PB_URL = import.meta.env.VITE_PB_URL || 'http://localhost:8090';

const pocketbaseClient = new Pocketbase(PB_URL);

// Files are fetched in the background and opened from a blob: URL on the
// site's own origin. Protected file fields need a short-lived token (minutes),
// so it's fetched at click time, and opening a *.up.railway.app PDF directly
// as a page gets blocked by common ad/privacy extensions (ERR_BLOCKED_BY_CLIENT).
// The tab is opened before any await so the browser still treats it as a
// user-initiated popup.
export async function openProtectedFile(record, filename) {
  const win = window.open('', '_blank');
  try {
    const token = await pocketbaseClient.files.getToken();
    const url = pocketbaseClient.files.getURL(record, filename, { token });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`File download failed (HTTP ${res.status})`);
    const blobUrl = URL.createObjectURL(await res.blob());
    if (win) {
      win.location.href = blobUrl;
    } else {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch (err) {
    console.error(err);
    win?.close();
    toast.error('Could not open the file. Please try again.');
  }
}

export default pocketbaseClient;
export { pocketbaseClient };
