function testFunc() {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve('test'), 5000);
  });
}

function fetchUsers() {
  return fetch('https://jsonplaceholder.typicode.com/users');
}

function fetchPosts() {
  return fetch('https://jsonplaceholder.typicode.com/posts');
}

function* myGenerator() {
  const test = yield testFunc();
  console.log(test);
  const users = yield fetchUsers();
  const usersRes = yield users.json();
  console.log(usersRes);
  const posts = yield fetchPosts();
  return posts.json();
}

const async = (generator, ...args) => {
  const gen = generator(...args);

  const step = (nextValue) => {
    const { value, done } = gen.next(nextValue);

    if (done) {
      if (value instanceof Promise) {
        return value;
      }
      return Promise.resolve(value);
    } else {
      if (value instanceof Promise) {
        return value.then(
          (value) => step(value),
          (reason) => step(reason)
        );
      } else {
        return step(value);
      }
    }
  };
  return step();
};

const result = async () => {
  const res = await async(myGenerator);
  return res;
};

result().then((res) => console.log(res));
