import { loadFurnitureModel } from './furniture-model.mjs';
const model = await loadFurnitureModel(false);
await model.dispose();
console.log('Pinned furniture matting model cached.');
