import Swal from 'sweetalert2';

/**
 * Show confirmation dialog before delete
 */
export const confirmDelete = async (
  title: string,
  text?: string,
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text: text || 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'rounded-md px-4 py-2',
      cancelButton: 'rounded-md px-4 py-2',
    },
  });

  return result.isConfirmed;
};

/**
 * Show success alert
 */
export const showSuccess = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonColor: '#6366f1',
    confirmButtonText: 'OK',
    timer: 2000,
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'rounded-md px-4 py-2',
    },
  });
};

/**
 * Show error alert
 */
export const showError = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: '#6366f1',
    confirmButtonText: 'OK',
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'rounded-md px-4 py-2',
    },
  });
};

/**
 * Show confirmation dialog
 */
export const confirm = async (
  title: string,
  text?: string,
  confirmButtonText = 'Confirm',
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#6366f1',
    cancelButtonColor: '#6b7280',
    confirmButtonText,
    cancelButtonText: 'Cancel',
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'rounded-md px-4 py-2',
      cancelButton: 'rounded-md px-4 py-2',
    },
  });

  return result.isConfirmed;
};
