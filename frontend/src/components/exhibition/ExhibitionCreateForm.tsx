import React from 'react';
import { Form, Input, Button, DatePicker, Switch, Alert } from 'antd';
import moment from 'moment';
import { useAuthContext } from '@/contexts/AuthContext';
import { ExhibitionCreateData } from '@/types/exhibition.types';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface ExhibitionCreateFormProps {
  onSubmit: (data: ExhibitionCreateData) => Promise<void>;
  loading?: boolean;
  initialValues?: Partial<ExhibitionCreateData>;
  mode?: 'create' | 'edit';
}

const ExhibitionCreateForm: React.FC<ExhibitionCreateFormProps> = ({
  onSubmit,
  loading = false,
  initialValues,
  mode = 'create',
}) => {
  const { user } = useAuthContext();
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    try {
      const formattedValues: ExhibitionCreateData = {
        title: values.title,
        description: values.description,
        startDate: values.dates[0].toISOString(),
        endDate: values.dates[1].toISOString(),
        isActive: values.isActive,
      };

      await onSubmit(formattedValues);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Format initial values for the form
  const formInitialValues = initialValues
    ? {
        title: initialValues.title,
        description: initialValues.description,
        dates: initialValues.startDate && initialValues.endDate
          ? [moment(initialValues.startDate), moment(initialValues.endDate)]
          : undefined,
        isActive: initialValues.isActive,
      }
    : {
        isActive: false,
        dates: [moment().add(1, 'days'), moment().add(30, 'days')],
      };

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={handleSubmit}
      initialValues={formInitialValues}
    >
      <Form.Item
        name="title"
        label="Exhibition Title"
        rules={[
          { required: true, message: 'Please enter a title' },
          { max: 100, message: 'Title cannot exceed 100 characters' },
        ]}
      >
        <Input placeholder="Enter exhibition title" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[
          { required: true, message: 'Please provide a description' },
        ]}
      >
        <TextArea
          placeholder="Describe the exhibition theme, featured artists, etc."
          rows={5}
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="dates"
        label="Exhibition Dates"
        rules={[
          { required: true, message: 'Please select exhibition dates' },
        ]}
      >
        <RangePicker
          style={{ width: '100%' }}
          format="YYYY-MM-DD"
          disabledDate={(current) => current && current < moment().startOf('day')}
        />
      </Form.Item>

      <Form.Item
        name="isActive"
        label="Active Status"
        valuePropName="checked"
        extra="Activate the exhibition to make it publicly visible"
      >
        <Switch />
      </Form.Item>

      {/* Note about artwork placement */}
      <Alert
        message="Note"
        description="After creating the exhibition, you will be able to add and position artworks in the 3D space."
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
        >
          {mode === 'create' ? 'Create Exhibition' : 'Update Exhibition'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ExhibitionCreateForm;