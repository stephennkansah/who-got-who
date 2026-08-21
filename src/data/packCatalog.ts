export type PublicPack = {
  id: 'core' | 'remote' | 'holiday-challenge';
  name: string;
};

const packs: PublicPack[] = [
  { id: 'core', name: 'Core Pack' },
  { id: 'remote', name: 'Remote Pack' },
  { id: 'holiday-challenge', name: 'Holiday Challenge Pack' },
];

export function getAllPackOptions(): PublicPack[] {
  return packs;
}
