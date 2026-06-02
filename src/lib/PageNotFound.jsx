import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function PageNotFound() {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-[#05070A] font-inter flex flex-col">
            <Nav />
            <div className="flex-1 flex items-center justify-center px-6 py-32">
                <div className="text-center max-w-xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* 404 */}
                        <div className="relative mb-8">
                            <div
                                className="text-[160px] font-black leading-none select-none"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(123,63,191,0.15) 0%, rgba(201,168,76,0.08) 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                                404
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[160px] font-black leading-none text-transparent"
                                    style={{ WebkitTextStroke: '1px rgba(123,63,191,0.3)' }}>
                                    404
                                </span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <span className="h-px flex-1 max-w-[60px] bg-[#C9A84C]/40" />
                            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C9A84C]">Страница не найдена</span>
                            <span className="h-px flex-1 max-w-[60px] bg-[#C9A84C]/40" />
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black tracking-[-0.03em] text-[#F8FAFC] mb-4">
                            Такой страницы<br />
                            <span className="text-[#7B3FBF]">не существует</span>
                        </h1>
                        <p className="text-[#F8FAFC]/50 mb-10 text-base leading-relaxed">
                            Запрашиваемая страница была удалена, перемещена<br className="hidden sm:block" /> или никогда не существовала.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.a
                                href="/"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-[#7B3FBF] hover:bg-[#8B4FCF] text-white text-sm font-bold tracking-wide transition-all duration-300 shadow-[0_0_30px_rgba(123,63,191,0.3)]"
                            >
                                На главную
                            </motion.a>
                            <motion.a
                                href="/#contacts"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg border border-[#C9A84C]/40 text-[#C9A84C] text-sm font-bold tracking-wide hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/70 transition-all duration-300"
                            >
                                Связаться с нами
                            </motion.a>
                        </div>
                    </motion.div>
                </div>
            </div>
            <Footer />
        </div>
    );
}