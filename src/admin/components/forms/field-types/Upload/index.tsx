import React, { useState, useEffect, useCallback } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useConfig } from '@payloadcms/config-provider';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import Label from '../../Label';
import Error from '../../Error';
import { upload } from '../../../../../fields/validations';
import FileDetails from '../../../elements/FileDetails';
import AddModal from './Add';
import SelectExistingModal from './SelectExisting';
import { Props } from './types';

import './index.scss';

const baseClass = 'upload';

const Upload: React.FC<Props> = (props) => {
  const { toggle } = useModal();
  const [internalValue, setInternalValue] = useState(undefined);
  const [missingFile, setMissingFile] = useState(false);
  const { collections, serverURL, routes: { api } } = useConfig();

  const {
    path: pathFromProps,
    name,
    required,
    admin: {
      readOnly,
      style,
      width,
      condition,
    } = {},
    label,
    validate = upload,
    relationTo,
    fieldTypes,
  } = props;

  const collection = collections.find((coll) => coll.slug === relationTo);

  const path = pathFromProps || name;
  const addModalSlug = `${path}-add`;
  const selectExistingModalSlug = `${path}-select-existing`;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);

  const fieldType = useFieldType({
    path,
    validate: memoizedValidate,
    condition,
  });

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = fieldType;

  const classes = [
    'field-type',
    baseClass,
    showError && 'error',
    readOnly && 'read-only',
  ].filter(Boolean).join(' ');

  useEffect(() => {
    if (typeof value === 'string') {
      const fetchFile = async () => {
        const response = await fetch(`${serverURL}${api}/${relationTo}/${value}`);

        if (response.ok) {
          const json = await response.json();
          setInternalValue(json);
        } else {
          setInternalValue(undefined);
          setValue(null);
          setMissingFile(true);
        }
      };

      fetchFile();
    }
  }, [value, setInternalValue, relationTo, api, serverURL, setValue]);

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <Error
        showError={showError}
        message={errorMessage}
      />
      <Label
        htmlFor={path}
        label={label}
        required={required}
      />
      {collection?.upload && (
        <React.Fragment>
          {(internalValue && !missingFile) && (
            <FileDetails
              collection={collection}
              doc={internalValue}
              handleRemove={() => {
                setInternalValue(undefined);
                setValue(null);
              }}
            />
          )}
          {(!value || missingFile) && (
            <div className={`${baseClass}__wrap`}>
              <Button
                buttonStyle="secondary"
                onClick={() => {
                  toggle(addModalSlug);
                }}
              >
                Upload new
                {' '}
                {collection.labels.singular}
              </Button>
              <Button
                buttonStyle="secondary"
                onClick={() => {
                  toggle(selectExistingModalSlug);
                }}
              >
                Choose from existing
              </Button>
            </div>
          )}
          <AddModal {...{
            collection,
            slug: addModalSlug,
            fieldTypes,
            setValue: (val) => {
              setMissingFile(false);
              setValue(val.id);
              setInternalValue(val);
            },
          }}
          />
          <SelectExistingModal {...{
            collection,
            slug: selectExistingModalSlug,
            setValue: (val) => {
              setMissingFile(false);
              setValue(val.id);
              setInternalValue(val);
            },
            addModalSlug,
          }}
          />
        </React.Fragment>
      )}
    </div>
  );
};
export default withCondition(Upload);
