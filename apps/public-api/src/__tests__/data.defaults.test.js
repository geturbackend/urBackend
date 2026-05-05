const {
  validateData,
  validateUpdateData,
} = require('../../../../packages/common/src/utils/validateData');

describe('default values behavior for collection fields', () => {
  const schemaRules = [
    { key: 'title', type: 'String', required: true },
    { key: 'status', type: 'String', required: false, default: 'pending' },
  ];

  test('insert without optional field applies default', () => {
    const { error, cleanData } = validateData({ title: 'Order A' }, schemaRules);

    expect(error).toBeUndefined();
    expect(cleanData).toEqual(
      expect.objectContaining({
        title: 'Order A',
        status: 'pending',
      }),
    );
  });

  test('insert with explicit field value does not override with default', () => {
    const { error, cleanData } = validateData(
      { title: 'Order B', status: 'confirmed' },
      schemaRules,
    );

    expect(error).toBeUndefined();
    expect(cleanData).toEqual(
      expect.objectContaining({
        title: 'Order B',
        status: 'confirmed',
      }),
    );
  });

  test('update payload does not inject defaults for missing fields', () => {
    const { error, updateData } = validateUpdateData({ title: 'Order C' }, schemaRules);

    expect(error).toBeUndefined();
    expect(updateData).toEqual(
      expect.objectContaining({
        title: 'Order C',
      }),
    );
    expect(Object.prototype.hasOwnProperty.call(updateData, 'status')).toBe(false);
  });
});
