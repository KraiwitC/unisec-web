import Header from "../../components/Header";
import Navbar from "../../components/Navbar";
import Partner from "../../components/Partner";
import Sponsor from "../../components/Sponsor";
import Divider from "../../components/Divider";
import Footer from "../../components/Footer";
import { getPartners, getSponsors } from "../sanity/sanityClient";

const Support = (props) => {
  return (
    <div className="relative min-h-screen bg-gradient">
      <Header />

      <main className="relative z-10 pt-22">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-16">
          <div className="relative my-6 md:my-12 text-center lg:text-left">
            <h1 className="font-impact text-6xl md:text-8xl xl:text-9xl text-gray-700/60 select-none">
              Support Us
            </h1>
            <h1 className="absolute inset-0 font-impact text-6xl md:text-8xl xl:text-9xl text-white">
              Support Us
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-8 md:mt-12 items-start">
            <div className="flex flex-col space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold font-helvethaica-blk-cond text-white tracking-wide mb-2">
                ร่วมเป็นส่วนหนึ่งในการผลักดันเยาวชนไทยสู่อวกาศ
              </h2>
              <p className="font-helvethaica-med-cond text-xl md:text-2xl text-gray-300 leading-normal">
                สมาคมนักศึกษาวิศวกรรมอวกาศไทย (UNISEC Thailand) เป็นองค์กรที่ไม่แสวงหากำไร
                ที่มุ่งส่งเสริมให้นักศึกษาได้ลงมือพัฒนาเทคโนโลยีอวกาศจริง ตั้งแต่การออกแบบดาวเทียมขนาดเล็ก
                (CubeSat) จรวดความเร็วสูง ไปจนถึงการแข่งขันระดับนานาชาติ
                การดำเนินงานของเราอาศัยการสนับสนุนจากผู้ที่เชื่อในศักยภาพของเยาวชนไทย
                เงินบริจาคทุกบาทจะถูกนำไปใช้พัฒนากิจกรรม อุปกรณ์ และโอกาสให้กับนักศึกษาโดยตรง
              </p>

              <h2 className="text-3xl md:text-4xl font-bold font-helvethaica-blk-cond text-white tracking-wide mt-6 mb-2">
                เงินสนับสนุนของคุณจะนำไปใช้ใน
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-300 font-helvethaica-med-cond text-xl md:text-2xl pl-2">
                <li>จัดเวิร์กชอปและค่ายอบรมด้านเทคโนโลยีอวกาศให้นักศึกษาทั่วประเทศ</li>
                <li>จัดหาอุปกรณ์และชิ้นส่วนสำหรับโครงการดาวเทียมและจรวดของนักศึกษา</li>
                <li>สนับสนุนทีมนักศึกษาไทยเข้าร่วมการแข่งขันระดับนานาชาติ</li>
                <li>ค่าดำเนินงานของสมาคมและการจัดกิจกรรมเผยแพร่ความรู้สู่สาธารณะ</li>
              </ul>
            </div>

            <div className="flex flex-col justify-start w-full font-helvethaica-med-cond">
              <div className="relative w-full max-w-xl mx-auto lg:mr-0">
                <div className="bg-custom-primary relative rounded-2xl border-2 border-white z-20 p-6 sm:p-8 lg:p-10 shadow-xl">
                  <h3 className="text-3xl md:text-4xl font-bold mb-6 text-white text-center tracking-wide">
                    ร่วมสนับสนุนเราได้ผ่านช่องทางต่อไปนี้
                  </h3>

                  <div className="space-y-6 text-gray-200">
                    <div className="border-b border-gray-700 pb-4">
                      <span className="text-gray-400 block text-lg md:text-xl uppercase tracking-wider mb-1">
                        ชื่อบัญชี / Account Name
                      </span>
                      <span className="text-2xl md:text-3xl font-bold text-white">
                        สมาคมนักศึกษาวิศวกรรมอวกาศไทย
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-700 pb-4">
                      <div>
                        <span className="text-gray-400 block text-lg md:text-xl uppercase tracking-wider mb-1">
                          ธนาคาร / Bank
                        </span>
                        <span className="text-2xl md:text-3xl font-semibold text-white">
                          ธ.กสิกรไทย (Kbank)
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-lg md:text-xl uppercase tracking-wider mb-1">
                          เลขบัญชี / Account Number
                        </span>
                        <span className="text-xl md:text-2xl font-mono font-bold text-white tracking-wider">
                          214-1-10706-5
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col items-center">
                      <p className="text-lg md:text-xl text-gray-400 mb-4 text-center">
                        หากต้องการขอรับใบเสร็จรับเงิน โปรดคลิกที่ปุ่มด้านล่างเพื่อกรอกข้อมูลผ่าน Google Form
                      </p>

                      <div className="relative cursor-pointer transform hover:translate-x-1 hover:translate-y-1 transition duration-300 inline-block mt-2">
                        <a
                          href="https://docs.google.com/forms/d/e/1FAIpQLSe4NiiWOau6dnLwwJp3aPbis7eX4Od7r3_6Ob8O8kKJyOhy4A/viewform?usp=dialog"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative z-20 inline-flex items-center justify-center px-6 py-3 border-2 border-white rounded-xl bg-custom-primary text-white font-bold text-lg md:text-xl cursor-pointer"
                        >
                          ขอรับใบเสร็จ / Request Receipt
                        </a>
                        <div className="absolute w-full top-2 left-2 rounded-xl bg-custom-primary border-2 border-white z-10 h-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute w-full top-3 left-3 rounded-2xl bg-custom-primary border-2 border-white z-10 h-full"></div>
              </div>
            </div>
          </div>
        </div>

        <Divider />

        <Partner partners={props.partners} />
        <Sponsor sponsors={props.sponsors} />
      </main>

      <footer className="absolute top-full w-full">
        <Footer />
      </footer>
    </div>
  );
};

export async function getStaticProps() {
  const partners = await getPartners();
  const sponsors = await getSponsors();

  return {
    props: {
      partners: partners || [],
      sponsors: sponsors || [],
    },
    revalidate: 300,
  };
}

export default Support;
