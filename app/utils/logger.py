import logging
import sys

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s pid:%(process)d %(levelname)s %(module)s - %(message)s',
                    stream=sys.stdout)

if __name__ == '__main__':
    logger.debug("debug logging")
    logger.info("info logging")
