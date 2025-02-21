import Link from 'next/link';

export default function Home() {
  return (
    <div className='flex justify-center gap-8 mt-4'>
      <Link key='sse' href='/examples/sse'>
        SSE
      </Link>
      <Link key='ollama' href='/examples/ollama'>
        Ollama
      </Link>
    </div>
  );
}
