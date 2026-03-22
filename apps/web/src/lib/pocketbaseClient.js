import Pocketbase from 'pocketbase';

const PB_URL = import.meta.env.VITE_PB_URL || 'http://localhost:8090';

const pocketbaseClient = new Pocketbase(PB_URL);

export default pocketbaseClient;
export { pocketbaseClient };
