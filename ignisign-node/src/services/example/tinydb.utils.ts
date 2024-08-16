

export const findOneCallback = async (resolve, reject, rejectIfNotFound = false) => async (err, result) => {
  if (err) {
    console.error(err);
    reject(err);
    return;
  }

  if (!result && rejectIfNotFound) {
    reject(new Error("Not found"));
    return;
  }

  resolve(result);
}

export const findCallback = async (resolve, reject) => async (err, results) => {
  if (err) {
    console.error(err);
    reject(err);
    return;
  }

  resolve(results);
}

export const insertCallback = async (resolve, reject) => async (err, inserted) => {
  if (err) {
    console.error(err);
    reject(err);
    return;
  }

  if (!inserted || !inserted.length) {
    reject(new Error("Not inserted"));
    return;
  }

  resolve(inserted[0]);
}
