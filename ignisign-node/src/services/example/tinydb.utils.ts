

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

const find = <T> (collection, query): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    collection.find(query).toArray(findCallback(resolve, reject));
  })
}

const updateOne = (model, query, data) => new Promise((resolve, reject) => {
  model.update(query, data, (err, res) => {
    if (err) return reject(err);
    resolve(res);
  })
})

const insert = (model, data) => new Promise((resolve, reject) => {
  model.insert(data, (err, res) => {
    if (err) return reject(err);
    resolve(res);
  })
})

const findOne = <T> (model, query): Promise<T> => new Promise((resolve, reject) => {
  model.findOne(query, (err, res) => {
    if (err) return reject(err);
    resolve(res);
  })
})

export const db = {
  find,
  findOne,
  insert,
  updateOne,
}