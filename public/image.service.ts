import apiClient from '../api/client';
import type { UploadImageResponse } from '../types';

const API_URL =import.meta.env.VITE_API_URL || '';

/**
 * Upload an image file
 * @param file - The image file to upload
 * @returns Image metadata including id and url
 */
export const uploadImage = async (file: File): Promise<UploadImageResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post<UploadImageResponse>('/image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

/**
 * Get image URL by ID
 * @param imageId - The image ID
 * @returns Full URL to the image
 */
export const getImageUrl = (imageId: string): string => {
    return `${API_URL}/image/${imageId}`;
};

/**
 * Delete an image by ID
 * @param imageId - The image ID to delete
 */
export const deleteImage = async (imageId: string): Promise<void> => {
    await apiClient.delete(`/image/${imageId}`);
};

/**
 * Validate image file before upload
 * @param file - The file to validate
 * @returns Validation result with error message if invalid
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Only JPEG and PNG images are allowed',
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'Image must be less than 5MB',
        };
    }

    return { valid: true };
};
