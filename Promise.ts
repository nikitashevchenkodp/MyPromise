const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise<T> {
  state: string;
  result: T | undefined;
  reason: string | undefined;
  resolveQueue: Array<Function>;
  rejecteQueue: Array<Function>;

  constructor(executor: (resolve: (result: T) => void, reject: (reason: string) => void) => void) {
    this.state = PENDING;
    this.result;
    this.reason;
    this.resolveQueue = [];
    this.rejecteQueue = [];

    const resolve = (value: T) => {
      if (this.state !== PENDING) return;
      this.state = FULFILLED;
      this.result = value;
      while (this.resolveQueue.length) {
        const callback = this.resolveQueue.shift();
        callback?.(value);
      }
    };

    const reject = (error: string) => {
      if (this.state !== PENDING) return;
      this.state = REJECTED;
      this.reason = error;
      while (this.rejecteQueue.length) {
        const callback = this.rejecteQueue.shift();
        callback?.(error);
      }
    };

    try {
      executor(resolve, reject);
    } catch (error: any) {
      reject(error);
    }
  }

  then(resolvedCallback: Function = () => {}, rejectedCallback?: (reason: string, state: string) => void) {
    return new MyPromise((resolve, reject) => {
      const resolveFunc = (result: T) => {
        try {
          if (typeof resolvedCallback !== 'function') {
            resolvedCallback = (result: T | undefined) => result;
          }
          const res: any = resolvedCallback(result, this.state);
          if (res instanceof MyPromise) {
            res.then(resolve, reject);
          } else {
            resolve(res);
          }
        } catch (error: any) {
          reject(error);
        }
      };

      const rejectFunc = (reason: string) => {
        try {
          if (!rejectedCallback) {
            reject(reason);
          }
          if (typeof rejectedCallback !== 'function') {
            rejectedCallback = (reason: string) => reason;
          }
          const res: any = rejectedCallback(reason, this.state);
          if (res instanceof MyPromise) {
            res.then(resolve, reject);
          } else {
            resolve(res);
          }
        } catch (error: any) {
          reject(error);
        }
      };

      switch (this.state) {
        case PENDING:
          this.resolveQueue.push(resolveFunc);
          this.rejecteQueue.push(rejectFunc);
          break;
        case FULFILLED:
          this.result && resolveFunc(this.result);
          break;
        case REJECTED:
          rejectFunc(this.reason!);
          break;
      }
    });
  }

  catch(rejectedCallback: (reason: string, state: string) => void) {
    return this.then(undefined, rejectedCallback);
  }

  finally(callback: Function = () => {}) {
    return this.then(
      (result: T) => {
        callback(result);
        new MyPromise((resolve) => {
          resolve(result);
        });
      },
      (reason: string) => {
        callback(reason);
        new MyPromise((reject) => {
          reject(reason);
        });
      }
    );
  }

  static resolve<U>(value: U) {
    if (value instanceof MyPromise) return value;
    return new MyPromise<U>((resolve) => resolve(value));
  }

  static reject<U>(reason: U) {
    return new MyPromise<U>((reject) => reject(reason));
  }

  static all<U>(promiseArr: Array<MyPromise<U>>) {
    let index = 0;
    let result: Array<U> = [];
    return new MyPromise<Array<U>>((resolve, reject) => {
      promiseArr.forEach((promis, i) => {
        MyPromise.resolve(promis).then(
          (value: U) => {
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

  static race<U>(promiseArr: Array<MyPromise<U>>) {
    return new MyPromise<U>((resolve, reject) => {
      promiseArr.forEach((promise) => {
        MyPromise.resolve(promise).then(
          (res: U) => {
            resolve(res);
          },
          (error) => {
            reject(error);
          }
        );
      });
    });
  }

  static any<U>(promiseArr: Array<MyPromise<U>>) {
    let reasons: Array<string> = [];
    return new MyPromise((resolve, reject) => {
      promiseArr.forEach((promis) => {
        MyPromise.resolve(promis).then(
          (result: U) => resolve(result),
          (error) => {
            reasons.push(error);
            if (reasons.length === promiseArr.length) {
              reject(reasons.join(''));
            }
          }
        );
      });
    });
  }

  static allSettled<U>(promiseArr: Array<MyPromise<U>>) {
    let results: Array<{ res: U | string; state: string }> = [];
    return new MyPromise((resolve, reject) => {
      promiseArr.forEach((promis) => {
        MyPromise.resolve(promis).then(
          (res: U, state: string) => {
            results.push({ res, state });
            if (results.length === promiseArr.length) resolve(results);
          },
          (res, state) => {
            results.push({ res, state });
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
const promise1 = new MyPromise<string>((resolve, reject) => {
  setTimeout(reject, 4000, 'one');
});

const promise2 = new MyPromise<number>((resolve, reject) => {
  setTimeout(() => reject('22'), 1000);
});
const promise3 = new MyPromise<number>((resolve, reject) => {
  setTimeout(() => resolve(33), 2000);
});
const promise4 = new MyPromise<string>((resolve, reject) => {
  setTimeout(() => reject('four'), 3000);
});

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

// MyPromise.allSettled<any>([promise1, promise2, promise3, promise4])
//   .then((value: string | number) => {
//     console.log(value);
//   })
//   .catch((reason) => {
//     console.log(reason);
//   });

// Filter, forEach, map, reduce, sort, push, pop, symbol.iterator, indexOf;

// const testPromise = new MyPromise<string>((resolve, reject) => {
//   console.log('Promise Created');
//   setTimeout(() => resolve('result'), 2000);
// });
// testPromise
//   .then((res: string) => {
//     console.log(res);
//     return new MyPromise<number>((resolve) => {
//       setTimeout(() => resolve(10), 2000);
//     });
//   })
//   .then((res: number) => console.log(res))
//   .then(() => {
//     throw new Error('test');
//   })
//   .then(() => console.log(2))
//   .then(() => console.log(3))
//   .then(() => console.log(4))
//   .then(() => console.log(5))
//   .then(() => console.log(6))
//   .catch((res: any) => console.log(res));
