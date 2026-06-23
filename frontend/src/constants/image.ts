export const IMAGE_TYPES = {
    COVER: 'cover',
    AVATAR: 'avatar',
} as const;

export type ImageType = typeof IMAGE_TYPES[keyof typeof IMAGE_TYPES];
