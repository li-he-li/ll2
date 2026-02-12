'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface PublishFormProps {
  initialData?: {
    id?: string;
    title: string;
    description?: string | null;
    publishPrice: number;
    imageUrl: string;
    category?: string | null;
    durationDays: number;
  };
  isEdit?: boolean;
}

export function PublishForm({ initialData, isEdit = false }: PublishFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [publishPrice, setPublishPrice] = useState(initialData?.publishPrice || 0);
  const [category, setCategory] = useState(initialData?.category || '');
  const [durationDays, setDurationDays] = useState(initialData?.durationDays || 7);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrors((prev) => ({ ...prev, image: '' }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '上传失败');
      }

      const data = await res.json();
      setImageUrl(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      setErrors((prev) => ({
        ...prev,
        image: error instanceof Error ? error.message : '上传失败',
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    // Validate
    const newErrors: Record<string, string> = {};

    if (!title || title.length < 2 || title.length > 100) {
      newErrors.title = '标题长度必须在2-100字符之间';
    }

    if (!publishPrice || publishPrice <= 0) {
      newErrors.publishPrice = '请输入有效的发布价格';
    }

    if (!imageUrl) {
      newErrors.image = '请上传商品图片';
    }

    if (description && description.length > 500) {
      newErrors.description = '描述不能超过500字符';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isEdit && initialData?.id
        ? `/api/products/${initialData.id}`
        : '/api/products';

      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: description || null,
          publishPrice,
          imageUrl,
          category: category || null,
          durationDays,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '操作失败');
      }

      // Show success message
      setSuccessMessage(isEdit ? '商品更新成功！' : '商品发布成功！');

      // Delay redirect to show success message
      setTimeout(() => {
        router.push('/my-products');
      }, 1500);
    } catch (error) {
      console.error('Submit error:', error);
      setErrors((prev) => ({
        ...prev,
        submit: error instanceof Error ? error.message : '操作失败',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const durationOptions = [
    { value: 1, label: '1天' },
    { value: 7, label: '1周' },
    { value: 30, label: '1月' },
  ];

  return (
    <div className="bg-bg-card shadow-card max-w-2xl mx-auto w-full rounded-xl p-8">
      <h1 className="text-text-primary mb-6 text-2xl font-bold">
        {isEdit ? '编辑商品' : '发布新商品'}
      </h1>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-green-200 mb-6 rounded-lg border p-4 text-green-700">
          <p className="font-semibold text-center">✅ {successMessage}</p>
          <p className="text-center text-sm">即将跳转到商品列表...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="text-text-primary mb-2 block text-sm font-semibold">
            商品标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入商品标题"
            className={`w-full rounded-lg border-2 bg-bg-page px-4 py-3 text-text-primary focus:border-primary focus:outline-none ${
              errors.title ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.title && (
            <p className="text-red-500 mt-1 text-sm">{errors.title}</p>
          )}
        </div>

        {/* Publish Price */}
        <div>
          <label className="text-text-primary mb-2 block text-sm font-semibold">
            发布价格 (元) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={publishPrice > 0 ? publishPrice : ''}
            onChange={(e) => setPublishPrice(parseFloat(e.target.value) || 0)}
            placeholder="请输入发布价格"
            className={`w-full rounded-lg border-2 bg-bg-page px-4 py-3 text-text-primary focus:border-primary focus:outline-none ${
              errors.publishPrice ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.publishPrice && (
            <p className="text-red-500 mt-1 text-sm">{errors.publishPrice}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-text-primary mb-2 block text-sm font-semibold">
            商品描述 (可选)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入商品描述（最多500字符）"
            rows={4}
            className={`w-full rounded-lg border-2 bg-bg-page px-4 py-3 text-text-primary focus:border-primary focus:outline-none ${
              errors.description ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          <p className="text-text-light mt-1 text-xs">{description.length}/500</p>
          {errors.description && (
            <p className="text-red-500 mt-1 text-sm">{errors.description}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="text-text-primary mb-2 block text-sm font-semibold">
            商品分类 (可选)
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="例如：电子产品、家居用品"
            className="w-full rounded-lg border-2 border-gray-200 bg-bg-page px-4 py-3 text-text-primary focus:border-primary focus:outline-none"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="text-text-primary mb-2 block text-sm font-semibold">
            商品图片 <span className="text-red-500">*</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-dashed bg-bg-page hover:bg-bg-page/80 border-2 border-gray-300 cursor-pointer rounded-lg p-6 text-center transition-colors"
          >
            {imageUrl ? (
              <div className="space-y-3">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="bg-bg-card mx-auto max-h-64 max-w-full rounded-lg object-contain"
                />
                <p className="text-text-secondary text-sm">点击更换图片</p>
              </div>
            ) : (
              <div>
                {isUploading ? (
                  <p className="text-primary">上传中...</p>
                ) : (
                  <>
                    <p className="text-text-primary mb-2 text-lg">📷 点击上传图片</p>
                    <p className="text-text-light text-sm">支持 JPG、PNG、WebP 格式，最大5MB</p>
                  </>
                )}
              </div>
            )}
          </div>
          {errors.image && (
            <p className="text-red-500 mt-2 text-sm">{errors.image}</p>
          )}
        </div>

        {/* Duration Selection */}
        <div>
          <label className="text-text-primary mb-3 block text-sm font-semibold">
            发布时长 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            {durationOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDurationDays(option.value)}
                className={`flex-1 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all ${
                  durationDays === option.value
                    ? 'bg-primary border-primary text-bg-card'
                    : 'border-gray-200 bg-bg-page text-text-primary hover:border-primary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-text-light mt-2 text-xs">
            商品将在发布后{durationDays === 1 ? '1天' : durationDays === 7 ? '1周' : '1月'}后自动过期
          </p>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border-red-200 rounded-lg border p-4 text-red-700">
            {errors.submit}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary shadow-button hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed w-full rounded-full px-6 py-4 text-bg-card text-lg font-bold transition-all"
        >
          {isSubmitting
            ? isEdit
              ? '保存中...'
              : '发布中...'
            : isEdit
              ? '保存修改'
              : '发布商品 🚀'}
        </button>
      </form>
    </div>
  );
}
