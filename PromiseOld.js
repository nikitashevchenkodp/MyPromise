const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
  constructor(executor) {
    this.state = PENDING;
    this.result;
    this.resolveQueue = [];
    this.rejecteQueue = [];

    const resolve = (value) => {
      if (this.state !== PENDING) return;
      this.state = FULFILLED;
      this.result = value;
      while (this.resolveQueue.length) {
        const callback = this.resolveQueue.shift();
        callback(value);
      }
    };

    const reject = (reason) => {
      if (this.state !== PENDING) return;
      this.state = REJECTED;
      this.result = reason;
      while (this.rejecteQueue.length) {
        const callback = this.rejecteQueue.shift();
        callback(reason);
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(resolvedCallback, rejectedCallback) {
    return new MyPromise((resolve, reject) => {
      const resolveFunc = (result) => {
        try {
          if (typeof resolvedCallback !== 'function') {
            resolvedCallback = (result) => result;
          }
          const res = resolvedCallback(result, this.state);
          if (res instanceof MyPromise) {
            res.then(resolve, reject);
          } else {
            resolve(res);
          }
        } catch (error) {
          reject(error);
        }
      };

      const rejectFunc = (reason) => {
        try {
          if (!rejectedCallback) reject(reason);
          if (typeof rejectedCallback !== 'function') {
            rejectedCallback = (reason) => reason;
          }
          const res = rejectedCallback(reason, this.state);
          if (res instanceof MyPromise) {
            res.then(resolve, reject);
          } else {
            resolve(res);
          }
        } catch (error) {
          reject(error);
        }
      };

      switch (this.state) {
        case PENDING:
          this.resolveQueue.push(resolveFunc);
          this.rejecteQueue.push(rejectFunc);
          break;
        case FULFILLED:
          resolveFunc(this.result);
          break;
        case REJECTED:
          rejectFunc(this.result);
          break;
      }
    });
  }

  catch(rejectedCallback) {
    return this.then(undefined, rejectedCallback);
  }

  finally(callback) {
    return this.then(
      (result) => MyPromise.resolve(callback(result)).then(() => result),
      (reason) => MyPromise.reject(callback(reason)).then(() => reason)
    );
  }

  static resolve(value) {
    if (value instanceof MyPromise) return value;
    return new MyPromise((resolve) => resolve(value));
  }

  static reject(reason) {
    if (value instanceof MyPromise) return value;
    return new MyPromise((reject) => reject(reason));
  }

  static all(promiseArr) {
    let index = 0;
    let result = [];
    return new MyPromise((resolve, reject) => {
      promiseArr.forEach((promis, i) => {
        MyPromise.resolve(promis).then(
          (value) => {
            index++;
            result[i] = value;
            if (index === promiseArr.length) {
              resolve(result);
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    });
  }

  static race(promiseArr) {
    return new MyPromise((resolve, reject) => {
      promiseArr.forEach((promise) => {
        MyPromise.resolve(promise).then(
          (res) => {
            resolve(res);
          },
          (error) => {
            reject(error);
          }
        );
      });
    });
  }

  static any(promiseArr) {
    let reasons = [];
    return new MyPromise((resolve, reject) => {
      promiseArr.forEach((promis) => {
        MyPromise.resolve(promis).then(
          (result) => resolve(result),
          (error) => {
            reasons.push(error);
            if (reasons.length === promiseArr.length) {
              reject(reasons);
            }
          }
        );
      });
    });
  }

  static allSettled(promiseArr) {
    let results = [];
    return new MyPromise((resolve, reject) => {
      promiseArr.forEach((promis) => {
        MyPromise.resolve(promis).then(
          (res, state) => {
            results.push({ res, state });
            if (results.length === promiseArr.length) resolve(results);
          },
          (reason, state) => {
            results.push({ reason, state });
            if (results.length === promiseArr.length) resolve(results);
          }
        );
      });
    });
  }
}

// let promise = new MyPromise((resolve) => {
//   console.log('created Promise');
//   // throw new Error('Error in promise');
//   setTimeout(() => {
//     resolve('res');
//   }, 2000);
// });

// promise
//   .then((res) => {
//     console.log(res);
//     return new MyPromise((resolve) => {
//       setTimeout(() => {
//         resolve(res + ' newPromice');
//       }, 2000);
//     });
//   })
//   .then((res) => {
//     console.log(res);
//     return res + ' 3';
//   })
//   .then((res) => {
//     console.log(res);
//     throw new Error('test catch and finally methods');
//   })
//   .then((res) => {
//     console.log('then');
//     return res + '5';
//   })
//   .then((res) => {
//     console.log('then');
//     return res + '4';
//   })
//   .catch((err) => console.log(err))

//Promise all()
// var p1 = MyPromise.resolve(3);
// var p2 = 1337;
// var p3 = new MyPromise((resolve, reject) => {
//   setTimeout(resolve, 5000, 'foo');
// });

// MyPromise.all([p1, p2, p3]).then((values) => {
//   console.log(values);
// });

//Promise any()
// const promise1 = new MyPromise((resolve, reject) => {
//   setTimeout(reject, 4000, 'one');
// });

// const promise2 = new MyPromise((resolve, reject) => {
//   setTimeout(() => reject('two'), 1000);
// });
// const promise3 = new MyPromise((resolve, reject) => {
//   setTimeout(() => resolve('three'), 2000);
// });
// const promise4 = new MyPromise((resolve, reject) => {
//   setTimeout(() => reject('four'), 3000);
// });

// MyPromise.any([promise1, promise2, promise3, promise4]).then(
//   (value) => {
//     console.log(value);
//   },
//   (error) => {
//     console.log(error);
//   }
// );

//Promise race()
// const promise1 = new MyPromise((resolve, reject) => {
//   setTimeout(reject, 4000, 'one');
// });

// const promise2 = new MyPromise((resolve, reject) => {
//   setTimeout(() => reject('two'), 1000);
// });
// const promise3 = new MyPromise((resolve, reject) => {
//   setTimeout(() => resolve('three'), 2000);
// });
// const promise4 = new MyPromise((resolve, reject) => {
//   setTimeout(() => reject('four'), 3000);
// });

// MyPromise.race([promise1, promise2, promise3, promise4])
//   .then((value) => {
//     console.log(value);
//   })
//   .catch((reason) => {
//     console.log(reason);
//   });

//Promise allSettled()
// const promise1 = new MyPromise((resolve, reject) => {
//   setTimeout(reject, 4000, 'one');
// });

// const promise2 = new MyPromise((resolve, reject) => {
//   setTimeout(() => reject('two'), 1000);
// });
// const promise3 = new MyPromise((resolve, reject) => {
//   setTimeout(() => resolve('three'), 2000);
// });
// const promise4 = new MyPromise((resolve, reject) => {
//   setTimeout(() => reject('four'), 3000);
// });

// MyPromise.allSettled([promise1, promise2, promise3, promise4])
//   .then((value) => {
//     console.log(value);
//   })
//   .catch((reason) => {
//     console.log(reason);
//   });

// Filter, forEach, map, reduce, sort, push, pop, symbol.iterator, indexOf;

const testPromise = new Promise((resolve, reject) => {
  console.log('Promise Created');
  setTimeout(() => {
    resolve(new Promise((resolve) => resolve('5')));
  }, 1000);
});
// const testPromise = MyPromise.resolve('5');
testPromise
  .then((res) => console.log(res))
  .then((res) => console.log(res))
  .then((res) => console.log(res))
  .then((res) => console.log(res));
