import { FolderRenderer } from '@/utils/core/renderer';
import { AssetFolder } from '@/utils/core/workspace';
import { ref } from 'vue';

export const globalFolderRenderer = ref<FolderRenderer | undefined>();
export const globalAssetFolder = ref<AssetFolder | undefined>();
