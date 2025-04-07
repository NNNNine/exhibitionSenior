import React, { useState } from 'react';
import { Form, Input, Button, Upload, Select, DatePicker, message, Alert, Image } from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useAuthContext } from '@/contexts/AuthContext';
import { ArtworkCreateData } from '@/types/artwork.types';

const { TextArea } = Input;
const { Dragger } = Upload;
const { Option } = Select;

interface ArtworkUploadFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  categories?: string[];
  loading?: boolean;
}

const ArtworkUploadForm: React.FC<ArtworkUploadFormProps> = ({
  onSubmit,
  categories = ['Painting', 'Photography', 'Digital Art', 'Sculpture', 'Mixed Media', 'Other'],
  loading = false,
}) => {
  const { user } = useAuthContext();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Validate file
  const beforeUpload = (file: File) => {
    const isJpgOrPngOrTiff = 
      file.type === 'image/jpeg' || 
      file.type === 'image/png' || 
      file.type === 'image/tiff';
    
    if (!isJpgOrPngOrTiff) {
      setUploadError('You can only upload JPG, PNG, or TIFF files!');
      return Upload.LIST_IGNORE;
    }
    
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      setUploadError('Image must be smaller than 10MB!');
      return Upload.LIST_IGNORE;
    }
    
    setUploadError(null);
    return false; // Prevent auto upload
  };

  // Handle file changes
  const handleFileChange = (info: any) => {
    // Update fileList (limited to one file)
    const newFileList = info.fileList.slice(-1);
    setFileList(newFileList);
    
    // Generate preview for uploaded file
    if (newFileList.length > 0) {
      const file = newFileList[0].originFileObj;
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (values: ArtworkCreateData) => {
    if (fileList.length === 0) {
      setUploadError('Please upload an image');
      return;
    }

    try {
      const formData = new FormData();
      
      // Append form values
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('category', values.category);
      
      // Convert tags array to JSON string and append
      if (values.tags && values.tags.length > 0) {
        formData.append('tags', JSON.stringify(values.tags));
      }
      
      // Append creation date if provided
      if (values.creationDate) {
        formData.append('creationDate', values.creationDate);
      }
      
      // Append file
      formData.append('image', fileList[0].originFileObj);
      
      // Submit form
      await onSubmit(formData);
      
      // Reset form and file list
      form.resetFields();
      setFileList([]);
      setPreviewImage(null);
      
      // Show success message
      message.success('Artwork uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={handleSubmit}
      initialValues={{
        creationDate: moment(),
      }}
    >
      <Form.Item
        name="title"
        label="Artwork Title"
        rules={[
          { required: true, message: 'Please enter a title' },
          { max: 100, message: 'Title cannot exceed 100 characters' }
        ]}
      >
        <Input placeholder="Enter title for your artwork" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[
          { required: true, message: 'Please provide a description' }
        ]}
      >
        <TextArea
          placeholder="Describe your artwork (medium, inspiration, etc.)"
          rows={4}
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="category"
        label="Category"
        rules={[
          { required: true, message: 'Please select a category' }
        ]}
      >
        <Select placeholder="Select a category">
          {categories.map(category => (
            <Option key={category} value={category}>{category}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="tags"
        label="Tags"
        extra="Separate tags with commas"
      >
        <Select
          mode="tags"
          placeholder="Add tags to help others discover your work"
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Form.Item
        name="creationDate"
        label="Creation Date"
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        label="Artwork Image"
        required
        validateStatus={uploadError ? 'error' : ''}
        help={uploadError}
      >
        <Dragger
          fileList={fileList}
          beforeUpload={beforeUpload}
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.tiff"
          multiple={false}
          showUploadList={false}
          customRequest={({ onSuccess }) => {
            setTimeout(() => {
              onSuccess?.({}, new XMLHttpRequest());
            }, 0);
          }}
        >
          {previewImage ? (
            <div className="p-4">
              <Image
                src={previewImage}
                alt="Artwork preview"
                style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }}
              />
              <p className="mt-2">Click or drag to replace</p>
            </div>
          ) : (
            <div className="p-8">
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag file to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for JPG, PNG, and TIFF. Max file size: 10MB.
              </p>
            </div>
          )}
        </Dragger>
      </Form.Item>

      {/* Show informational note about approval process */}
      <Alert
        message="Artwork Submission Note"
        description="Your uploaded artwork will be reviewed by a curator before being displayed in exhibitions. This process may take up to 48 hours."
        type="info"
        showIcon
        className="mb-6"
      />

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
          disabled={!user || user.role !== 'artist'}
        >
          Upload Artwork
        </Button>
        {(!user || user.role !== 'artist') && (
          <div className="mt-2 text-center text-red-500">
            Only artists can upload artwork
          </div>
        )}
      </Form.Item>
    </Form>
  );
};

export default ArtworkUploadForm;