import Swal from "sweetalert2";

export const showError = (title = "Error", message = "Something went wrong.") => {
  Swal.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonColor: "#3085d6",
  });
};
