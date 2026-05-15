import React, { useRef, useEffect } from 'react';

const OTP_LENGTH = 6;

const OtpInput = ({ value = '', onChange, disabled = false, autoFocus = false }) => {
  const inputsRef = useRef([]);

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const focusAt = (index) => {
    const el = inputsRef.current[index];
    if (el) el.focus();
  };

  const updateValue = (next) => {
    const cleaned = next.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(cleaned);
    return cleaned;
  };

  const handleChange = (index, raw) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const chars = value.padEnd(OTP_LENGTH, ' ').split('').slice(0, OTP_LENGTH);
    chars[index] = digit || ' ';
    const next = updateValue(chars.join('').replace(/\s/g, ''));
    if (digit && index < OTP_LENGTH - 1) {
      focusAt(index + 1);
    }
    return next;
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        e.preventDefault();
        const chars = value.split('');
        chars[index - 1] = '';
        updateValue(chars.join(''));
        focusAt(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusAt(index - 1);
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      focusAt(index + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    updateValue(pasted);
    focusAt(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  return (
    <div className="otp-row" role="group" aria-label="Verification code digits">
      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          className="otp-box"
          value={value[index] || ''}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
};

export default OtpInput;
