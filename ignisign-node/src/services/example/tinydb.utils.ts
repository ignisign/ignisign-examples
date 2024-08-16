

export const findOneCallback = (resolve, reject, rejectIfNotFound = false) => async (err, result) => {
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

export const findCallback = (resolve, reject) => async (err, results) => {
  if (err) {
    console.error(err);
    reject(err);
    return;
  }

  resolve(results);
}

export const insertCallback = (resolve, reject) => async (err, inserted) => {
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
