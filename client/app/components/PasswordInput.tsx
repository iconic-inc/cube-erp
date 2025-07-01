// hooks
import {
  useState,
  useEffect,
  DetailedHTMLProps,
  InputHTMLAttributes,
  ReactNode,
} from 'react';

// utils
import PropTypes from 'prop-types';

const PasswordInput = ({
  id,
  label = 'Password',
  name,
  isInvalid,
  ...props
}: {
  id: string;
  name?: string;
  label?: ReactNode;
  isInvalid?: boolean;
  placeholder: string;
} & DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = (e: any) => {
    e.preventDefault();
    setIsPasswordVisible(!isPasswordVisible);
  };

  useEffect(() => {
    props.value === '' && setIsPasswordVisible(false);
  }, [props.value]);

  return (
    <div className='field-wrapper'>
      <label
        className='field-label text-gray-700 font-bold text-sm'
        htmlFor={id}
      >
        {label}
      </label>
      <div className='relative'>
        <input
          id={id}
          name={name || id}
          type={isPasswordVisible ? 'text' : 'password'}
          autoComplete='current-password'
          {...props}
          className={`block w-full border border-gray-300 rounded-md mt-1 py-2 px-3 focus:outline-none 
            focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ${props.className || ''}`}
        />
        <button
          className='field-btn'
          onClick={togglePasswordVisibility}
          type='button'
          aria-label='Toggle password visibility'
        >
          {isPasswordVisible ? (
            <span className='material-symbols-outlined absolute right-2 top-2'>
              visibility
            </span>
          ) : (
            <span className='material-symbols-outlined absolute right-2 top-2'>
              visibility_off
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

PasswordInput.propTypes = {
  innerRef: PropTypes.func,
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  isInvalid: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
};

export default PasswordInput;
