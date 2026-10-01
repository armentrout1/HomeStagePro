import { AutoModelForImageSegmentation, AutoProcessor, BackgroundRemovalPipeline, env } from '@huggingface/transformers';

export const MODEL = 'onnx-community/BiRefNet_512x512-ONNX';
export const REVISION = 'b0b30aff33d009f6bcd7dacdc3cdcf2f8f42175b';

export async function loadFurnitureModel(offline = true) {
  env.cacheDir = process.env.SEGMENTATION_CACHE_DIR || '.model-cache';
  env.allowRemoteModels = !offline;
  const options = {
    revision: REVISION,
    local_files_only: offline,
    dtype: 'fp32',
    device: 'cpu',
    session_options: { intraOpNumThreads: 2, enableCpuMemArena: false, enableMemPattern: false },
  };
  // Direct constructors avoid pipeline()'s unversioned remote file-discovery step.
  const model = await AutoModelForImageSegmentation.from_pretrained(MODEL, options);
  const processor = await AutoProcessor.from_pretrained(MODEL, options);
  return new BackgroundRemovalPipeline({ task: 'background-removal', model, processor });
}
