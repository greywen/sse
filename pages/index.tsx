import Link from 'next/link';

export default function Home() {
  return (
    <div className='flex justify-center gap-8 mt-4'>
      <Link key='one' href='/examples/one'>
        实例一
      </Link>
      <Link key='two' href='/examples/two'>
        实例二
      </Link>
      <Link key='three' href='/examples/three'>
        实例三
      </Link>
      <Link key='four' href='/examples/four'>
        实例四
      </Link>
    </div>
  );
}
